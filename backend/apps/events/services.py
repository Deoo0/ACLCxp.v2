"""Event writes serialize on the event row. PostgreSQL is required for row locks."""
from datetime import datetime
from django.db import connection
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import APIException
from apps.core.permissions import is_admin
from .models import EventRegistration


class Conflict(APIException):
    status_code = 409
    default_detail = "The operation conflicts with the current event state."
    default_code = "conflict"


def eligible(event, user):
    if event.visibility == "PRIVATE":
        return False  # Invitation management is not yet supported.
    restrictions = (event.allowed_programs, event.allowed_houses, event.allowed_year_levels)
    if not user or not user.is_authenticated or not user.is_active:
        return event.visibility == "PUBLIC" and not any(restrictions)
    return all(not values or value in values for values, value in (
        (event.allowed_programs, user.program),
        (event.allowed_houses, user.house_id),
        (event.allowed_year_levels, user.year_level),
    ))


def visible_events(queryset, user):
    # Managers can see their drafts; others see only published lifecycle states.
    if is_admin(user):
        return queryset
    published = Q(status__in=["PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"])
    audience = ~Q(visibility="PRIVATE")
    authenticated = user.is_authenticated and user.is_active
    fields = (("allowed_programs", user.program if authenticated else None),
              ("allowed_houses", user.house_id if authenticated else None),
              ("allowed_year_levels", user.year_level if authenticated else None))
    if connection.features.supports_json_field_contains:
        for field, value in fields:
            match = Q(**{f"{field}__isnull": True}) | Q(**{field: []})
            if value is not None:
                match |= Q(**{f"{field}__contains": [value]})
            audience &= match
        if not authenticated:
            audience &= Q(visibility="PUBLIC")
    else:
        # SQLite development/test fallback; production PostgreSQL filters in SQL.
        ids = [event.pk for event in queryset.filter(published) if eligible(event, user)]
        audience = Q(pk__in=ids)
    visible = published & audience
    if authenticated and user.role == "ORGANIZER":
        visible |= Q(organizer=user)
    return queryset.filter(visible)


def event_start(event):
    return timezone.make_aware(datetime.combine(event.event_date, event.start_time))


def registration_open(event, now):
    return (event.status == "PUBLISHED" and now < event_start(event)
            and (event.registration_opens_at is None or now >= event.registration_opens_at)
            and (event.registration_closes_at is None or now < event.registration_closes_at))


def promote_waitlist(event, now):
    """Caller holds the event lock; skipped students receive a cancellation reason."""
    if not registration_open(event, now):
        return
    waiting = event.registrations.filter(status="WAITLISTED").select_related("user").order_by("registered_at", "pk")
    for registration in waiting:
        if event.current_registered >= event.capacity:
            break
        if not registration.user.is_active or registration.user.role != "STUDENT" or not eligible(event, registration.user):
            registration.status = "CANCELLED"
            registration.cancelled_at = now
            registration.cancellation_reason = "No longer eligible for this event."
        else:
            registration.status = "REGISTERED"
            event.current_registered += 1
        registration.waitlist_position = None
        registration.save()
    event.save(update_fields=["current_registered", "updated_at"])


def register_locked(event, user):
    """Caller must hold the event row lock inside transaction.atomic."""
    if user.role != "STUDENT" or not user.is_active or not eligible(event, user):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You are not eligible to register for this event.")
    existing = event.registrations.filter(user=user).first()
    if existing and existing.status in ("REGISTERED", "WAITLISTED", "ATTENDED", "NO_SHOW"):
        return existing, False
    from apps.analytics.models import SystemSetting
    if SystemSetting.objects.filter(key="registration_enabled", value="false").exists():
        raise Conflict("Event registration is temporarily paused.")
    now = timezone.now()
    if not registration_open(event, now):
        raise Conflict("Registration is not open for this event.")
    promote_waitlist(event, now)
    full = event.current_registered >= event.capacity
    if full and not event.allow_waitlist:
        raise Conflict("This event is full.")
    registration = existing or EventRegistration(event=event, user=user)
    registration.status = "WAITLISTED" if full else "REGISTERED"
    if full:
        from django.db.models import Max
        last = event.registrations.filter(status="WAITLISTED").aggregate(last=Max("waitlist_position"))["last"] or 0
        registration.waitlist_position = last + 1
    else:
        registration.waitlist_position = None
        event.current_registered += 1
        event.save(update_fields=["current_registered", "updated_at"])
    registration.cancelled_at = None
    registration.cancellation_reason = ""
    registration.registered_at = now
    registration.save()
    return registration, True


def cancel_locked(event, user, reason):
    from django.shortcuts import get_object_or_404
    registration = get_object_or_404(event.registrations, user=user)
    if registration.status == "CANCELLED":
        return registration
    now = timezone.now()
    if registration.status not in ("REGISTERED", "WAITLISTED") or now >= event_start(event) or event.status != "PUBLISHED":
        raise Conflict("This registration can no longer be cancelled.")
    if registration.status == "REGISTERED":
        event.current_registered -= 1
        event.save(update_fields=["current_registered", "updated_at"])
    registration.status = "CANCELLED"
    registration.waitlist_position = None
    registration.cancelled_at = now
    registration.cancellation_reason = reason
    registration.save()
    promote_waitlist(event, now)
    return registration


def update_locked(event, serializer):
    now = timezone.now()
    old_status = event.status
    new_status = serializer.validated_data.get("status", old_status)
    transitions = {"DRAFT": {"PUBLISHED", "CANCELLED"}, "PUBLISHED": {"ONGOING", "CANCELLED"},
                   "ONGOING": {"COMPLETED"}, "COMPLETED": set(), "CANCELLED": set()}
    if new_status != old_status and new_status not in transitions[old_status]:
        raise Conflict("This event status transition is not allowed.")
    if old_status in ("COMPLETED", "CANCELLED"):
        raise Conflict("Finalized events cannot be edited.")
    audience_fields = {"visibility", "allowed_programs", "allowed_houses", "allowed_year_levels"}
    if event.registrations.exclude(status="CANCELLED").exists() and any(
            key in serializer.validated_data and serializer.validated_data[key] != getattr(event, key)
            for key in audience_fields):
        raise Conflict("Eligibility cannot change while active registrations exist.")
    metadata = {}
    if new_status == "PUBLISHED" and old_status != new_status:
        metadata["published_at"] = now
    if new_status == "COMPLETED" and old_status != new_status:
        metadata["completed_at"] = now
    event = serializer.save(**metadata)
    if new_status == "CANCELLED":
        event.registrations.filter(status__in=["REGISTERED", "WAITLISTED"]).update(
            status="CANCELLED", cancelled_at=now, cancellation_reason="Event cancelled by organizer.",
            waitlist_position=None, updated_at=now)
        event.current_registered = 0
        event.save(update_fields=["current_registered", "updated_at"])
    else:
        promote_waitlist(event, now)
    return event
