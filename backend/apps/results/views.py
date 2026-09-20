from django.contrib.auth.models import AnonymousUser
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework import serializers
from apps.core.pagination import ApiPagination
from apps.events.models import Event
from apps.events.services import visible_events
from apps.events.images import EventImageField
from .models import EventResult, MatchAnnouncement


class ResultSerializer(serializers.ModelSerializer):
    participant = serializers.SerializerMethodField()

    def get_participant(self, obj):
        if obj.house:
            return f"{obj.house.name} · {obj.team_name}" if obj.team_name else obj.house.name
        return obj.team_name or "Individual participant"

    class Meta:
        model = EventResult
        fields = ["id", "participant", "rank", "score", "notes", "photo_url"]


class MatchSerializer(serializers.ModelSerializer):
    team_one = serializers.SerializerMethodField()
    team_two = serializers.SerializerMethodField()

    def get_team_one(self, obj):
        return self.side(obj.house_one, obj.team_one)

    def get_team_two(self, obj):
        return self.side(obj.house_two, obj.team_two)

    def side(self, house, team):
        return f"{house.name} · {team}" if house and team else (house.name if house else team)

    class Meta:
        model = MatchAnnouncement
        fields = ["id", "label", "team_one", "team_two", "scheduled_at"]


class CompetitionSerializer(serializers.ModelSerializer):
    banner_image = EventImageField(read_only=True)
    results = ResultSerializer(many=True)
    matches = MatchSerializer(many=True)
    category_name = serializers.CharField(source="category.name")

    class Meta:
        model = Event
        fields = ["id", "title", "category_name", "event_date", "venue", "banner_image", "results", "matches"]


class CompetitionFeed(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CompetitionSerializer
    pagination_class = ApiPagination

    def get_queryset(self):
        # This is a public feed, including when viewed by a signed-in manager.
        events = visible_events(Event.objects.all(), AnonymousUser()).filter(archived_at__isnull=True)
        results = EventResult.objects.filter(is_verified=True).select_related("house").order_by("rank", "pk")
        matches = MatchAnnouncement.objects.filter(is_published=True, scheduled_at__gte=timezone.now()).select_related("house_one", "house_two")
        if self.request.query_params.get("tab") == "matches":
            events = events.filter(status__in=["PUBLISHED", "ONGOING"], matches__in=matches).order_by("event_date", "start_time", "pk")
        else:
            events = events.filter(status__in=["PUBLISHED", "ONGOING", "COMPLETED"], results__in=results).order_by("-event_date", "-pk")
        return events.distinct().select_related("category").prefetch_related(
            Prefetch("results", queryset=results), Prefetch("matches", queryset=matches))
