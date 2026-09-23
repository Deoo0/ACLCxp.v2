from uuid import uuid4
from django.utils.text import slugify
from apps.core.text_limits import LimitedModelSerializer
from datetime import datetime
from django.utils import timezone
from rest_framework import serializers
from apps.houses.models import House
from .models import Event, EventCategory, EventRegistration, EventTeam
from .images import EventImageField


class EventCategorySerializer(LimitedModelSerializer):
    def create(self, validated_data):
        validated_data["slug"] = f"{slugify(validated_data['name'])[:16] or 'category'}-{uuid4().hex}"
        return super().create(validated_data)

    class Meta:
        model = EventCategory
        fields = ["id", "name", "slug", "description", "icon", "color_code", "display_order", "is_active"]
        read_only_fields = ["slug"]


class TeamMemberSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    role = serializers.CharField(max_length=100)


class EventTeamSerializer(serializers.ModelSerializer):
    photo = EventImageField(required=False, allow_null=True)
    members = TeamMemberSerializer(many=True, max_length=100)
    house_name = serializers.CharField(source="house.name", read_only=True)

    class Meta:
        model = EventTeam
        fields = ["house", "house_name", "photo", "members"]
        validators = []


class EventSerializer(LimitedModelSerializer):
    teams = EventTeamSerializer(many=True, required=False, max_length=30)

    def validate_teams(self, teams):
        houses = [team["house"].pk for team in teams]
        if len(houses) != len(set(houses)):
            raise serializers.ValidationError("Add each house only once.")
        return teams

    def _save_teams(self, event, teams):
        if teams is None:
            return
        keep = []
        for index, data in enumerate(teams):
            team, _ = EventTeam.objects.update_or_create(
                event=event, house=data["house"], defaults={**data, "display_order": index})
            keep.append(team.pk)
        event.teams.exclude(pk__in=keep).delete()

    capacity = serializers.IntegerField(required=False, min_value=1)
    banner_image = EventImageField(required=False, allow_null=True)
    poster_image = EventImageField(required=False, allow_null=True)

    def _lock_audience_houses(self, ids):
        ids = set(ids or [])
        found = list(House.objects.select_for_update().filter(pk__in=ids, is_active=True).order_by("pk").values_list("pk", flat=True))
        if set(found) != ids:
            raise serializers.ValidationError({"allowed_houses": "A selected house is no longer available. Refresh and choose active houses."})

    def create(self, validated_data):
        teams = validated_data.pop("teams", None)
        validated_data["slug"] = f"{slugify(validated_data['title'])[:200] or 'event'}-{uuid4().hex}"
        self._lock_audience_houses(validated_data.get("allowed_houses"))
        event = super().create(validated_data)
        self._save_teams(event, teams)
        return event

    def update(self, instance, validated_data):
        teams = validated_data.pop("teams", None)
        if "allowed_houses" in validated_data:
            self._lock_audience_houses(validated_data["allowed_houses"])
        event = super().update(instance, validated_data)
        self._save_teams(event, teams)
        return event

    tags = serializers.ListField(child=serializers.CharField(max_length=50), max_length=20, required=False, allow_null=True)

    registration_status = serializers.CharField(read_only=True, allow_null=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    allowed_programs = serializers.ListField(child=serializers.CharField(max_length=50), required=False, allow_null=True)
    allowed_houses = serializers.ListField(child=serializers.IntegerField(min_value=1), required=False, allow_null=True)
    allowed_year_levels = serializers.ListField(child=serializers.IntegerField(min_value=1), required=False, allow_null=True)

    class Meta:
        model = Event
        fields = ["id", "teams", "registration_status", "title", "slug", "description", "category", "category_name", "organizer",
                  "event_date", "start_time", "end_time", "venue", "capacity", "current_registered",
                  "available_slots", "attendance_mode", "registration_required", "allow_waitlist", "registration_opens_at", "registration_closes_at",
                  "visibility", "allowed_programs", "allowed_houses", "allowed_year_levels",
                  "participation_points", "first_place_points", "second_place_points", "third_place_points",
                  "banner_image", "poster_image", "status", "is_featured", "tags", "requirements",
                  "rules", "prizes", "total_attended", "published_at", "completed_at", "archived_at", "created_at", "updated_at"]
        read_only_fields = ["slug", "organizer", "current_registered", "total_attended", "published_at", "completed_at", "archived_at", "created_at", "updated_at"]

    def validate(self, attrs):
        if not attrs.get("registration_required", getattr(self.instance, "registration_required", True)):
            attrs.update(capacity=max(1, getattr(self.instance, "current_registered", 0)),
                         allow_waitlist=False, registration_opens_at=None, registration_closes_at=None)
        def value(name, default=None):
            return attrs.get(name, getattr(self.instance, name, default))
        if value("capacity", 0) < 1 or value("capacity", 0) < value("current_registered", 0):
            raise serializers.ValidationError({"capacity": "Capacity must be positive and cover existing registrations."})
        if value("end_time") is not None and value("end_time") <= value("start_time"):
            raise serializers.ValidationError({"end_time": "End time must follow start time on the same day."})
        opens, closes = value("registration_opens_at"), value("registration_closes_at")
        start = timezone.make_aware(datetime.combine(value("event_date"), value("start_time")))
        if opens and closes and opens >= closes:
            raise serializers.ValidationError({"registration_closes_at": "Closing must follow opening."})
        if (opens and opens >= start) or (closes and closes > start):
            raise serializers.ValidationError("Registration windows must precede the event start.")
        if value("visibility") == "PROGRAM" and not value("allowed_programs"):
            raise serializers.ValidationError({"allowed_programs": "Choose at least one program."})
        if value("visibility") == "HOUSE" and not value("allowed_houses"):
            raise serializers.ValidationError({"allowed_houses": "Choose at least one house ID."})
        if "allowed_houses" in attrs and attrs["allowed_houses"]:
            ids = set(attrs["allowed_houses"])
            if House.objects.filter(pk__in=ids, is_active=True).count() != len(ids):
                raise serializers.ValidationError({"allowed_houses": "Choose active house IDs."})
        for field in ("participation_points", "first_place_points", "second_place_points", "third_place_points"):
            if value(field, 0) < 0:
                raise serializers.ValidationError({field: "Award points cannot be negative."})
        if not self.instance and value("status", "DRAFT") not in ("DRAFT", "PUBLISHED"):
            raise serializers.ValidationError({"status": "Create an event as draft or published."})
        if value("status", "DRAFT") == "PUBLISHED" and start <= timezone.now():
            raise serializers.ValidationError({"event_date": "Published events must start in the future."})
        category = value("category")
        if category and not category.is_active:
            raise serializers.ValidationError({"category": "Choose an active category."})
        return attrs


class RegistrationSerializer(LimitedModelSerializer):
    student_name = serializers.CharField(source="user.get_full_name", read_only=True)
    student_id = serializers.CharField(source="user.student_id", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = EventRegistration
        fields = ["id", "event", "event_title", "user", "student_name", "student_id", "status", "waitlist_position",
                  "registered_at", "cancelled_at", "cancellation_reason"]
        read_only_fields = fields


class CancellationSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=1000, default="")
