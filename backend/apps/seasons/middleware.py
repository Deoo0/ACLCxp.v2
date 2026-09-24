from django.db import transaction
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import APIException
from .models import Season
from .scope import valid_membership, student_session_error


class SeasonMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith(("/api/", "/admin/")):
            return self.get_response(request)
        # Serialize season changes with operational writes, including ticket redemption.
        with transaction.atomic():
            if request.method not in ("GET", "HEAD", "OPTIONS"):
                list(Season.objects.select_for_update().order_by("pk"))
            season = Season.objects.filter(is_current=True).first()
            if (request.path.startswith("/admin/") and request.path not in ("/admin/login/", "/admin/logout/")
                    and request.method not in ("GET", "HEAD", "OPTIONS") and season and season.status == "CLOSED"):
                return JsonResponse({"detail": "This season is closed. Use the Seasons page to export records or open a new season."}, status=409)
            if request.path.startswith("/api/auth/registration/") and (not season or season.status not in ("REGISTRATION", "ACTIVE")):
                return JsonResponse({"detail": "Season registration is closed."}, status=409)
            user = getattr(request, "_force_auth_user", None) or getattr(request, "user", None)
            if not user or not user.is_authenticated:
                try:
                    auth = JWTAuthentication().authenticate(request)
                    if auth:
                        user = auth[0]
                except APIException:
                    pass  # DRF returns its normal authentication error.
            if user and user.is_authenticated and request.path == "/api/auth/me/":
                error = student_session_error(user, season)
                if error:
                    return JsonResponse(error, status=403)
            allowed = request.path in ("/api/auth/login/", "/api/auth/token/refresh/", "/api/auth/me/", "/api/auth/logout/", "/api/seasons/access/", "/api/seasons/redeem/")
            if user and user.is_authenticated and user.role == "STUDENT" and not allowed:
                if not season or season.status != "ACTIVE" or not valid_membership(user, season):
                    return JsonResponse({"detail": "Season access is locked. Activate a ticket for the current season.", "code": "SEASON_ACCESS_REQUIRED"}, status=403)
            operational = request.path.startswith(("/api/events/", "/api/admin/matchups/", "/api/admin/results/", "/api/admin/attendance/", "/api/attendance/daily/", "/api/admin/points/", "/api/admin/tickets/"))
            if season and operational and request.method not in ("GET", "HEAD", "OPTIONS"):
                if season.status == "CLOSED":
                    return JsonResponse({"detail": "This season is closed. Export its records or open a new season."}, status=409)
                if season.status != "ACTIVE" and request.path.startswith(("/api/admin/results/", "/api/admin/attendance/", "/api/attendance/daily/", "/api/admin/points/")):
                    return JsonResponse({"detail": "Start the season before recording attendance, results, or points."}, status=409)
            return self.get_response(request)
