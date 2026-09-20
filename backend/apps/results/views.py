from django.contrib.auth.models import AnonymousUser
from django.db.models import Prefetch
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework import serializers
from apps.core.pagination import ApiPagination
from apps.events.models import Event
from apps.events.services import visible_events
from apps.events.images import EventImageField
from .models import EventResult, MatchAnnouncement
from apps.houses.models import House


class CompetitionHouseSerializer(serializers.ModelSerializer):
    logo_url = EventImageField(read_only=True)

    class Meta:
        model = House
        fields = ["id", "name", "color_code", "logo_url"]


class ResultSerializer(serializers.ModelSerializer):
    house = CompetitionHouseSerializer(read_only=True)
    participant = serializers.SerializerMethodField()

    def get_participant(self, obj):
        if obj.house:
            return f"{obj.house.name} · {obj.team_name}" if obj.team_name else obj.house.name
        return obj.team_name or "Individual participant"

    class Meta:
        model = EventResult
        fields = ["id", "participant", "house", "team_name", "rank", "score", "notes", "photo_url"]


class MatchSerializer(serializers.ModelSerializer):
    house_one = serializers.SerializerMethodField()
    house_two = serializers.SerializerMethodField()
    team_one_name = serializers.SerializerMethodField()
    team_two_name = serializers.SerializerMethodField()
    team_one = serializers.SerializerMethodField()
    team_two = serializers.SerializerMethodField()
    winner_label = serializers.SerializerMethodField()

    def get_house_one(self, obj):
        house = obj.participant("one")[0]
        return CompetitionHouseSerializer(house, context=self.context).data if house else None

    def get_house_two(self, obj):
        house = obj.participant("two")[0]
        return CompetitionHouseSerializer(house, context=self.context).data if house else None

    def get_team_one_name(self, obj):
        return obj.participant("one")[1]

    def get_team_two_name(self, obj):
        return obj.participant("two")[1]

    def get_team_one(self, obj):
        return obj.participant("one")[2]

    def get_team_two(self, obj):
        return obj.participant("two")[2]

    def get_winner_label(self, obj):
        return obj.participant(obj.winner_side.lower())[2] if obj.winner_side else ""

    class Meta:
        model = MatchAnnouncement
        fields = ["id", "label", "team_one", "team_two", "house_one", "house_two", "team_one_name", "team_two_name", "scheduled_at", "winner_side", "winner_label", "completed_at", "source_one", "source_two"]


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
        matches = MatchAnnouncement.objects.filter(is_published=True).select_related("house_one", "house_two", "source_one", "source_two")
        tab = self.request.query_params.get("tab")
        matches = matches.exclude(winner_side="") if tab == "match-results" else matches.filter(winner_side="")
        if tab in ("matches", "match-results"):
            events = events.filter(status__in=["PUBLISHED", "ONGOING", "COMPLETED"], matches__in=matches).order_by("event_date", "start_time", "pk")
        else:
            events = events.filter(status__in=["PUBLISHED", "ONGOING", "COMPLETED"], results__in=results).order_by("-event_date", "-pk")
        return events.distinct().select_related("category").prefetch_related(
            Prefetch("results", queryset=results), Prefetch("matches", queryset=matches))
