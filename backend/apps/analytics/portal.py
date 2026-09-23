import base64
import qrcode
import qrcode.image.svg
from django.core import signing
from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.core.pagination import ApiPagination
from apps.events.models import EventRegistration
from apps.attendance.models import Attendance
from apps.users.models import User
from .console import effective_points, houses_with_totals
from .serializers import PointsSerializer, AttendanceSerializer, HouseSerializer, SETTING_DEFAULTS
from .models import SystemSetting


def public_settings():
    result = {key: value[0] for key, value in SETTING_DEFAULTS.items()}
    result.update(dict(SystemSetting.objects.filter(key__in=result).values_list("key", "value")))
    return result


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def summary(request):
    points = effective_points().filter(user=request.user).aggregate(total=Sum("points"))["total"] or 0
    from apps.seasons.scope import current_season
    season = current_season()
    students = User.objects.filter(role="STUDENT", is_active=True)
    point_filter = Q(points_transactions__is_approved=True, points_transactions__is_reversed=False)
    if season:
        students = students.filter(season_memberships__season=season)
        point_filter &= Q(points_transactions__season=season)
    students = students.annotate(total=Sum("points_transactions__points", filter=point_filter, default=0))
    return Response({"points": points, "rank": students.filter(total__gt=points).count() + 1,
        "attendance": Attendance.objects.filter(user=request.user, is_valid=True).count(),
        "registered": EventRegistration.objects.filter(user=request.user).exclude(status="CANCELLED").count(),
        "houses": HouseSerializer(houses_with_totals().filter(is_active=True), many=True, context={"request": request}).data,
        "settings": public_settings()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def merit(request):
    qs = effective_points().filter(user=request.user).select_related("event", "house", "user").order_by("-created_at", "-pk")
    search = request.query_params.get("search", "")
    if search:
        qs = qs.filter(Q(reason__icontains=search) | Q(event__title__icontains=search))
    page = ApiPagination()
    return page.get_paginated_response(PointsSerializer(page.paginate_queryset(qs, request), many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance(request):
    qs = Attendance.objects.filter(user=request.user).select_related("user", "event").order_by("-scanned_at", "-pk")
    qs = qs.filter(event__title__icontains=request.query_params.get("search", ""))
    page = ApiPagination()
    return page.get_paginated_response(AttendanceSerializer(page.paginate_queryset(qs, request), many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_overview(request):
    from apps.seasons.scope import current_season
    registrations = {r.event_id: r for r in EventRegistration.objects.filter(
        user=request.user).select_related("event", "event__category")}
    scans = {a.event_id: a for a in Attendance.objects.filter(user=request.user).select_related(
        "event", "event__category", "scanned_by")}
    records = []
    for event_id in registrations.keys() | scans.keys():
        registration, scan = registrations.get(event_id), scans.get(event_id)
        event = scan.event if scan else registration.event
        if scan and scan.is_valid:
            status, detail = "ATTENDED", "Verified attendance"
        elif event.status == "CANCELLED" or (registration and registration.status == "CANCELLED"):
            status, detail = "CANCELLED", "Event cancelled" if event.status == "CANCELLED" else "Registration cancelled"
        elif scan and not scan.is_valid:
            status, detail = "INVALID", "Attendance invalidated"
        elif registration and registration.status == "WAITLISTED":
            status, detail = "WAITLISTED", "Awaiting a place"
        elif event.attendance_mode == "NONE":
            status, detail = "NOT_REQUIRED", "Attendance is not required"
        elif event.status == "COMPLETED":
            status, detail = "ABSENT", "Registered · no verified check-in"
        else:
            status, detail = "PENDING", "Event ongoing" if event.status == "ONGOING" else "Upcoming event"
        records.append({"id": event_id, "event_title": event.title, "category": event.category.name,
            "event_date": event.event_date, "start_time": event.start_time,
            "status": status, "detail": detail,
            "signed_by": scan.scanned_by.get_full_name() if scan and scan.is_valid and scan.scanned_by else None,
            "scanned_at": scan.scanned_at if scan else None,
            "validation_notes": scan.validation_notes if scan else ""})
    records.sort(key=lambda row: (row["event_date"], row["start_time"], row["id"]), reverse=True)
    counts = {status.lower(): sum(r["status"] == status for r in records)
              for status in ("ATTENDED", "ABSENT", "PENDING", "INVALID", "CANCELLED", "WAITLISTED")}
    total = counts["attended"] + counts["absent"] + counts["pending"] + counts["invalid"]
    season = current_season()
    search = request.query_params.get("search", "").strip().casefold()
    status = request.query_params.get("status", "")
    filtered = [r for r in records if (not status or r["status"] == status)
                and search in r["event_title"].casefold()]
    page = ApiPagination()
    response = page.get_paginated_response(page.paginate_queryset(filtered, request))
    response.data["summary"] = {**counts, "total": total,
        "rate": round(counts["attended"] / total * 100, 1) if total else 0,
        "season": season.name if season else "All records",
        "points": effective_points().filter(user=request.user).aggregate(total=Sum("points"))["total"] or 0}
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def event_pass(request):
    token = signing.dumps({"student_id": request.user.student_id}, salt="student-event-pass")
    svg = qrcode.make(token, image_factory=qrcode.image.svg.SvgPathImage, box_size=6, border=4).to_string()
    response = Response({"image": "data:image/svg+xml;base64," + base64.b64encode(svg).decode(),
                         "expires_at": (timezone.now() + timezone.timedelta(seconds=300)).isoformat()})
    response["Cache-Control"] = "no-store"
    return response
