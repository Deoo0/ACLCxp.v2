from rest_framework import serializers
from apps.users.models import User, StudentRoster, IntramuralsTicket
from apps.users.serializers import UpdateUserSerializer
from apps.houses.models import House
from apps.attendance.models import Attendance
from apps.results.models import PointsTransaction, EventResult
from .models import AuditLog, SystemSetting


class AdminUserSerializer(serializers.ModelSerializer):
    house_name = serializers.CharField(source="house.name", read_only=True, default="")
    full_name = serializers.CharField(source="get_full_name", read_only=True)
    class Meta:
        model = User
        fields = ["id", "student_id", "first_name", "last_name", "full_name", "email", "program", "year_level", "role", "house", "house_name", "is_active", "email_verified"]
        read_only_fields = fields


class AdminUserUpdateSerializer(UpdateUserSerializer):
    class Meta(UpdateUserSerializer.Meta):
        fields = UpdateUserSerializer.Meta.fields + ["is_active"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        actor = self.context["request"].user
        if self.instance.pk == actor.pk and (attrs.get("is_active") is False or ("role" in attrs and attrs["role"] != actor.role)):
            raise serializers.ValidationError("You cannot disable or demote your own account.")
        return attrs


class RosterSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentRoster
        fields = ["id", "student_number", "first_name", "middle_name", "last_name", "program", "year_level", "section", "is_eligible", "account"]
        read_only_fields = ["account"]
        extra_kwargs = {"year_level": {"min_value": 1}}


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntramuralsTicket
        fields = ["id", "ticket_number", "qr_token", "status", "issued_at", "redeemed_at", "redeemed_by"]
        read_only_fields = fields


class HouseSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source="actual_members", read_only=True)
    total_points = serializers.IntegerField(source="actual_points", read_only=True)
    class Meta:
        model = House
        fields = ["id", "name", "description", "color_code", "logo_url", "motto", "is_active", "member_count", "total_points"]

    def validate_color_code(self, value):
        import re
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
            raise serializers.ValidationError("Use a six-digit hex color, such as #fbbf24.")
        return value


class AttendanceSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="user.student_id", read_only=True)
    student_name = serializers.CharField(source="user.get_full_name", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)
    class Meta:
        model = Attendance
        fields = ["id", "event", "event_title", "user", "student_id", "student_name", "scanned_at", "scan_method", "is_valid", "validation_notes"]
        read_only_fields = fields


class PointsSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="user.get_full_name", read_only=True, default="")
    house_name = serializers.CharField(source="house.name", read_only=True, default="")
    event_title = serializers.CharField(source="event.title", read_only=True, default="")
    class Meta:
        model = PointsTransaction
        fields = ["id", "user", "student_name", "house", "house_name", "event", "event_title", "transaction_type", "points", "reason", "is_approved", "is_reversed", "reversal_reason", "created_at"]
        read_only_fields = fields


class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="user.get_full_name", read_only=True, default="")
    house_name = serializers.CharField(source="house.name", read_only=True, default="")
    event_title = serializers.CharField(source="event.title", read_only=True)
    class Meta:
        model = EventResult
        fields = ["id", "event", "event_title", "user", "student_name", "house", "house_name", "result_type", "team_name", "rank", "score", "points_awarded", "notes", "is_verified"]
        read_only_fields = ["points_awarded", "is_verified"]
        extra_kwargs = {"rank": {"required": True, "allow_null": False, "min_value": 1, "max_value": 3}}

    def validate(self, attrs):
        kind = attrs.get("result_type", "INDIVIDUAL")
        if kind == "INDIVIDUAL":
            user = attrs.get("user")
            if not user or user.role != "STUDENT" or not user.is_active:
                raise serializers.ValidationError("Choose an active student.")
            attrs["house"] = user.house
        elif not attrs.get("house") or attrs.get("user"):
            raise serializers.ValidationError("Team/house results require a house and no individual student.")
        if kind == "TEAM" and not attrs.get("team_name"):
            raise serializers.ValidationError("Enter the team name.")
        return attrs


class AuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ["id", "user_email", "user_role", "action", "description", "status", "created_at"]
        read_only_fields = fields


SETTING_DEFAULTS = {
    "announcement": ("", "STRING", "Announcement shown on the student dashboard"),
    "support_email": ("", "STRING", "Student support email address"),
    "merit_milestone": ("300", "INTEGER", "Points per student milestone"),
    "registration_enabled": ("true", "BOOLEAN", "Allow new event registrations"),
}


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ["id", "key", "value", "data_type", "description", "updated_at"]
        read_only_fields = ["key", "data_type", "description", "updated_at"]

    def validate_value(self, value):
        key = self.instance.key
        if key not in SETTING_DEFAULTS:
            raise serializers.ValidationError("This setting is not editable here.")
        if key == "merit_milestone" and (not value.isdecimal() or not 1 <= int(value) <= 1000000):
            raise serializers.ValidationError("Enter a whole number between 1 and 1,000,000.")
        if key == "registration_enabled" and value not in ("true", "false"):
            raise serializers.ValidationError("Use true or false.")
        if key == "support_email" and value:
            serializers.EmailField().run_validation(value)
        if len(value) > 2000:
            raise serializers.ValidationError("Maximum length is 2,000 characters.")
        return value
