from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers, viewsets
from apps.core.permissions import IsSchoolAdmin
from apps.core.pagination import ApiPagination
from apps.houses.models import House
from .models import MatchAnnouncement


class MatchAdminSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    house_one_name = serializers.CharField(source="house_one.name", read_only=True, default="")
    house_two_name = serializers.CharField(source="house_two.name", read_only=True, default="")
    house_one = serializers.PrimaryKeyRelatedField(queryset=House.objects.all(), required=True)
    house_two = serializers.PrimaryKeyRelatedField(queryset=House.objects.all(), required=True)

    class Meta:
        model = MatchAnnouncement
        fields = ["id", "event", "event_title", "label", "house_one", "house_two", "house_one_name", "house_two_name", "team_one", "team_two", "scheduled_at", "is_published"]

    def validate(self, attrs):
        def value(key):
            return attrs.get(key, getattr(self.instance, key, None))
        one, two = value("house_one"), value("house_two")
        if not one or not two:
            raise serializers.ValidationError("Select a house for each side.")
        if one == two:
            raise serializers.ValidationError({"house_two": "Choose a different opposing house."})
        if any(not house.is_active for house in (one, two)):
            raise serializers.ValidationError("Choose active houses.")
        event = value("event")
        if value("is_published"):
            if event.status not in ("PUBLISHED", "ONGOING") or event.archived_at:
                raise serializers.ValidationError("Publish matchups only for published or ongoing, unarchived events.")
            if value("scheduled_at") <= timezone.now():
                raise serializers.ValidationError({"scheduled_at": "Schedule the match in the future to publish it."})
        return attrs


class MatchAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSchoolAdmin]
    pagination_class = ApiPagination
    serializer_class = MatchAdminSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", "")
        return MatchAnnouncement.objects.select_related("event", "house_one", "house_two").filter(
            Q(event__title__icontains=search) | Q(label__icontains=search) | Q(house_one__name__icontains=search) |
            Q(house_two__name__icontains=search) | Q(team_one__icontains=search) | Q(team_two__icontains=search)
        ).order_by("-scheduled_at", "-pk")
