from django.db import transaction
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.permissions import IsSchoolAdmin
from apps.core.pagination import ApiPagination
from apps.events.models import Event
from apps.events.services import Conflict
from apps.houses.models import House
from .models import MatchAnnouncement


def has_finished_descendant(match):
    pending, seen = [match.pk], set()
    while pending:
        pk = pending.pop()
        if pk in seen:
            continue
        seen.add(pk)
        children = MatchAnnouncement.objects.filter(Q(source_one_id=pk) | Q(source_two_id=pk))
        if children.exclude(winner_side="").exists():
            return True
        pending.extend(children.values_list("pk", flat=True))
    return False


class MatchAdminSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    house_one_name = serializers.SerializerMethodField()
    house_two_name = serializers.SerializerMethodField()
    winner_label = serializers.SerializerMethodField()
    house_one = serializers.PrimaryKeyRelatedField(queryset=House.objects.all(), required=False, allow_null=True)
    house_two = serializers.PrimaryKeyRelatedField(queryset=House.objects.all(), required=False, allow_null=True)

    def get_house_one_name(self, obj):
        return obj.participant("one")[2]

    def get_house_two_name(self, obj):
        return obj.participant("two")[2]

    def get_winner_label(self, obj):
        return obj.participant(obj.winner_side.lower())[2] if obj.winner_side else ""

    class Meta:
        model = MatchAnnouncement
        fields = ["id", "event", "event_title", "label", "house_one", "house_two", "house_one_name", "house_two_name", "team_one", "team_two", "source_one", "source_two", "scheduled_at", "is_published", "winner_side", "winner_label", "completed_at"]
        read_only_fields = ["winner_side", "winner_label", "completed_at"]

    def validate(self, attrs):
        def value(key):
            return attrs.get(key, getattr(self.instance, key, None))
        event = value("event")
        if self.instance and event.pk != self.instance.event_id:
            raise serializers.ValidationError({"event": "A bracket match cannot be moved to another event."})
        if self.instance and (self.instance.winner_side or has_finished_descendant(self.instance)):
            if any(key != "is_published" for key in attrs):
                raise serializers.ValidationError("Clear completed downstream winners, then this winner, before editing the match.")
        resolved = []
        for side in ("one", "two"):
            house, source, team = value(f"house_{side}"), value(f"source_{side}"), value(f"team_{side}")
            if source:
                if house or team:
                    raise serializers.ValidationError({f"source_{side}": "Choose a source match OR a house/team, not both."})
                if source.event_id != event.pk:
                    raise serializers.ValidationError({f"source_{side}": "Choose a match from the same event."})
                pending, seen = [source], set()
                while pending:
                    node = pending.pop()
                    if self.instance and node.pk == self.instance.pk:
                        raise serializers.ValidationError("Bracket links cannot form a cycle or refer to this match.")
                    if node.pk in seen:
                        continue
                    seen.add(node.pk)
                    pending.extend(item for item in (node.source_one, node.source_two) if item)
                house = source.participant(source.winner_side.lower())[0] if source.winner_side else None
            elif team and not house:
                raise serializers.ValidationError({f"house_{side}": "Select the house for this team, or leave both blank for TBD."})
            if house and not house.is_active:
                raise serializers.ValidationError("Choose active houses.")
            resolved.append(house)
        if resolved[0] and resolved[0] == resolved[1]:
            raise serializers.ValidationError({"house_two": "Choose a different opposing house."})
        if value("source_one") and value("source_one") == value("source_two"):
            raise serializers.ValidationError("The same match winner cannot occupy both sides.")
        if value("is_published") and not value("winner_side"):
            if event.status not in ("PUBLISHED", "ONGOING") or event.archived_at:
                raise serializers.ValidationError("Publish pending matches only for published or ongoing, unarchived events.")
        return attrs


class MatchAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSchoolAdmin]
    pagination_class = ApiPagination
    serializer_class = MatchAdminSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", "")
        qs = MatchAnnouncement.objects.select_related("event", "house_one", "house_two", "source_one", "source_two").filter(
            Q(event__title__icontains=search) | Q(label__icontains=search) | Q(house_one__name__icontains=search) |
            Q(house_two__name__icontains=search) | Q(team_one__icontains=search) | Q(team_two__icontains=search))
        if self.request.query_params.get("event"):
            event = serializers.IntegerField(min_value=1).run_validation(self.request.query_params["event"])
            qs = qs.filter(event_id=event)
        return qs.order_by("scheduled_at", "pk")

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        event_id = serializers.IntegerField().run_validation(request.data.get("event"))
        get_object_or_404(Event.objects.select_for_update(), pk=event_id)
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        match = self.get_object()
        Event.objects.select_for_update().get(pk=match.event_id)
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        match = self.get_object()
        Event.objects.select_for_update().get(pk=match.event_id)
        match.refresh_from_db()
        if match.winner_side:
            raise Conflict("Clear the match winner before deleting it.")
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            raise Conflict("Remove this match's links from later rounds before deleting it.")

    @action(detail=True, methods=["post"], url_path="winner")
    @transaction.atomic
    def winner(self, request, pk=None):
        match = self.get_object()
        event = Event.objects.select_for_update().get(pk=match.event_id)
        match.refresh_from_db()
        side = serializers.ChoiceField(choices=["ONE", "TWO", ""]).run_validation(request.data.get("winner_side"))
        if side != match.winner_side:
            if has_finished_descendant(match):
                raise Conflict("Clear winners in completed later rounds before correcting this match.")
            if side:
                one, two = match.participant("one")[0], match.participant("two")[0]
                if not one or not two or one == two:
                    raise Conflict("Both different competing houses must be determined before selecting a winner.")
                if event.status not in ("PUBLISHED", "ONGOING", "COMPLETED"):
                    raise Conflict("Cannot record a winner for a draft or cancelled event.")
            match.winner_side = side
            match.completed_at = timezone.now() if side else None
            match.save(update_fields=["winner_side", "completed_at", "updated_at"])
        return Response(self.get_serializer(match).data)
