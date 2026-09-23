"""One staff approval per student for a school's calendar day."""
from zoneinfo import ZoneInfo
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from apps.events.models import Event
from apps.events.services import Conflict, event_start
from .operations import check_in
from .models import AuditLog

SCHOOL_ZONE = ZoneInfo("Asia/Manila")


class CanApproveAttendance(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and
                    (user.is_superuser or user.role in ("ADMIN", "STAFF", "ORGANIZER")))


def selected_day(request):
    value = request.data.get("date") if request.method == "POST" else request.query_params.get("date")
    day = serializers.DateField().run_validation(value)
    if day > timezone.now().astimezone(SCHOOL_ZONE).date():
        raise serializers.ValidationError("Daily approval is not available for future dates.")
    return day


def day_events(day, lock=False):
    qs = Event.objects.filter(attendance_mode="DAILY", archived_at__isnull=True,
        status__in=["PUBLISHED", "ONGOING", "COMPLETED"],
        event_date__range=(day - timedelta(days=1), day)).order_by("pk")
    if lock:
        qs = qs.select_for_update()
    now = timezone.now()
    return [event for event in qs if event_start(event).astimezone(SCHOOL_ZONE).date() == day
            and event_start(event) <= now]


@api_view(["GET", "POST"])
@permission_classes([CanApproveAttendance])
def daily_attendance(request):
    day = selected_day(request)
    if request.method == "GET":
        events = day_events(day)
        return Response({"date": day, "timezone": "Asia/Manila", "events": [
            {"id": event.pk, "title": event.title, "registration_required": event.registration_required,
             "points": event.participation_points} for event in events]})
    token = serializers.CharField(required=False, allow_blank=True).run_validation(request.data.get("token", ""))
    student_id = serializers.CharField(required=False, allow_blank=True).run_validation(request.data.get("student_id", ""))
    if not token and not student_id:
        raise serializers.ValidationError("Enter a student number or scan a QR pass.")
    with transaction.atomic():
        events = day_events(day, lock=True)
        if not events:
            raise Conflict("No events are available for daily approval on this date.")
        approved, existing, skipped = [], [], []
        student_name = ""
        approved_student_id = None
        for event in events:
            try:
                attendance, created = check_in(request.user, event.pk, student_id or None, token or None, daily=True)
            except Conflict as exc:
                skipped.append({"id": event.pk, "title": event.title, "reason": str(exc.detail)})
                continue
            approved_student_id = attendance.user_id
            student_name = attendance.user.get_full_name() or attendance.user.student_id
            (approved if created else existing).append({"id": event.pk, "title": event.title})
        AuditLog.objects.create(user=request.user, user_email=request.user.email, user_role=request.user.role,
            action="DAILY_ATTENDANCE", resource_type="ATTENDANCE", status="SUCCESS",
            description=f"Daily attendance approval for {day} (Asia/Manila)",
            changes={"date": str(day), "student_id": approved_student_id, "approved": approved, "already_recorded": existing, "skipped": skipped},
            request_method=request.method, request_path=request.path)
    return Response({"student_name": student_name, "date": day, "approved": approved,
                     "already_recorded": existing, "skipped": skipped})
