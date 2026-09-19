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
    students = User.objects.filter(role="STUDENT", is_active=True).annotate(
        total=Sum("points_transactions__points", filter=Q(points_transactions__is_approved=True, points_transactions__is_reversed=False), default=0))
    return Response({"points": points, "rank": students.filter(total__gt=points).count() + 1,
        "attendance": Attendance.objects.filter(user=request.user, is_valid=True).count(),
        "registered": EventRegistration.objects.filter(user=request.user).exclude(status="CANCELLED").count(),
        "houses": HouseSerializer(houses_with_totals().filter(is_active=True), many=True).data,
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
def event_pass(request):
    token = signing.dumps({"student_id": request.user.student_id}, salt="student-event-pass")
    svg = qrcode.make(token, image_factory=qrcode.image.svg.SvgPathImage, box_size=6, border=4).to_string()
    response = Response({"image": "data:image/svg+xml;base64," + base64.b64encode(svg).decode(),
                         "expires_at": (timezone.now() + timezone.timedelta(seconds=300)).isoformat()})
    response["Cache-Control"] = "no-store"
    return response
