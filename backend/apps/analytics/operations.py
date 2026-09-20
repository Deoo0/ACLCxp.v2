from django.core import signing
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.events.models import Event, EventRegistration
from apps.events.services import Conflict, eligible
from apps.attendance.models import Attendance, ScanLog
from apps.users.models import User
from apps.houses.models import House
from apps.results.models import PointsTransaction


def post_points(*, user=None, house=None, points, source_key, actor, reason, kind, event=None, result=None):
    from apps.seasons.scope import require_membership
    require_membership(user)
    house = house or (user.house if user else None)
    entry, created = PointsTransaction.objects.get_or_create(source_key=source_key, defaults=dict(
        user=user, house=house, points=points, reason=reason, transaction_type=kind,
        event=event, result=result, created_by=actor, approved_by=actor, is_approved=True))
    if not created and source_key.startswith("manual:"):
        if (entry.user_id != (user.pk if user else None) or entry.points != points
                or entry.reason != reason or (not user and entry.house_id != house.pk)):
            raise Conflict("This request key was already used for a different award.")
    if created and house:
        House.objects.filter(pk=house.pk).update(total_points=F("total_points") + points)
    return entry, created


def reverse_points(entry, actor, reason):
    if not entry.is_reversed:
        entry.is_reversed = True
        entry.reversed_at = timezone.now()
        entry.reversed_by = actor
        entry.reversal_reason = reason
        entry.save()
        if entry.house_id and entry.is_approved:
            House.objects.filter(pk=entry.house_id).update(total_points=F("total_points") - entry.points)


@transaction.atomic
def check_in(actor, event_id, student_id=None, token=None, *, daily=False):
    event = get_object_or_404(Event.objects.select_for_update(), pk=event_id)
    if event.archived_at:
        raise Conflict("Archived events cannot accept attendance.")
    if event.attendance_mode == "NONE":
        raise Conflict("Attendance is not required for this event.")
    if daily:
        from apps.events.services import event_start
        if event.attendance_mode != "DAILY" or event.status not in ("PUBLISHED", "ONGOING", "COMPLETED") or event_start(event) > timezone.now():
            raise Conflict("This event is not available for daily approval.")
    elif event.attendance_mode == "DAILY":
        raise Conflict("Use daily approval for this event; one scan covers the day's eligible events.")
    elif event.status != "ONGOING":
        raise Conflict("Start the event before recording attendance.")
    if token:
        try:
            payload = signing.loads(token, salt="student-event-pass", max_age=300)
            student_id = payload["student_id"]
        except (signing.BadSignature, KeyError, TypeError):
            raise ValidationError("Invalid or expired QR code. Ask the student to refresh their pass.")
    user = get_object_or_404(User.objects.select_related("house"), student_id=student_id, role="STUDENT", is_active=True)
    from apps.seasons.scope import require_membership
    require_membership(user)
    if daily or not event.registration_required:
        from apps.users.models import IntramuralsTicket
        tickets = IntramuralsTicket.objects.filter(status="REDEEMED", redeemed_by__account=user)
        if event.season_id:
            tickets = tickets.filter(season_id=event.season_id)
        if not tickets.exists():
            raise Conflict("A redeemed ticket for this season is required before check-in.")
    existing = Attendance.objects.filter(event=event, user=user).first()
    if existing:
        if not existing.is_valid:
            raise Conflict("This attendance was voided. Restore the record to correct it.")
        return existing, False
    registration = EventRegistration.objects.filter(event=event, user=user, status="REGISTERED").first()
    if event.registration_required and not registration:
        raise Conflict("A confirmed registration is required. Waitlisted students cannot check in.")
    if not eligible(event, user):
        raise Conflict("This student no longer meets the event eligibility rules.")
    attendance = Attendance.objects.create(event=event, user=user, scanned_by=actor,
                                           scan_method="QR_CODE" if token else "MANUAL",
                                           validation_notes="Approved through daily attendance." if daily else "")
    if registration:
        registration.status = "ATTENDED"
        registration.attended = True
        registration.attendance_marked_at = timezone.now()
        registration.attendance_marked_by = actor
        registration.save()
    event.total_attended += 1
    event.save(update_fields=["total_attended", "updated_at"])
    post_points(user=user, points=event.participation_points, source_key=f"attendance:{attendance.pk}",
                actor=actor, reason=f"Participation: {event.title}", kind="PARTICIPATION", event=event)
    ScanLog.objects.create(event=event, user=user, scanned_by=actor, success=True)
    return attendance, True


@transaction.atomic
def correct_attendance(actor, attendance_id, valid, reason):
    reference = get_object_or_404(Attendance, pk=attendance_id)
    event = Event.objects.select_for_update().get(pk=reference.event_id)
    attendance = Attendance.objects.select_for_update().get(pk=attendance_id)
    if attendance.is_valid == valid:
        return attendance
    entry = PointsTransaction.objects.select_for_update().filter(source_key=f"attendance:{attendance.pk}").first()
    if not entry:
        raise Conflict("Legacy attendance needs a points reconciliation before correction.")
    attendance.is_valid = valid
    attendance.validation_notes = reason
    attendance.save()
    EventRegistration.objects.filter(event=event, user=attendance.user).update(
        status="ATTENDED" if valid else "REGISTERED", attended=valid,
        attendance_marked_at=timezone.now() if valid else None, attendance_marked_by=actor)
    event.total_attended = max(0, event.total_attended + (1 if valid else -1))
    event.save(update_fields=["total_attended", "updated_at"])
    if valid and entry.is_reversed:
        entry.is_reversed = False
        entry.reversed_at = None
        entry.reversed_by = None
        entry.reversal_reason = ""
        entry.save()
        if entry.house_id:
            House.objects.filter(pk=entry.house_id).update(total_points=F("total_points") + entry.points)
    elif not valid:
        reverse_points(entry, actor, reason)
    return attendance
