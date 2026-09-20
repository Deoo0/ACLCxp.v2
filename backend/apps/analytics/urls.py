from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import console, portal
from .daily_attendance import daily_attendance
from apps.results.management import MatchAdminViewSet

router = DefaultRouter()
router.register("matchups", MatchAdminViewSet, basename="console-matchups")
for prefix, view in [("users", console.UsersViewSet), ("roster", console.RosterViewSet),
    ("tickets", console.TicketsViewSet), ("houses", console.HousesViewSet),
    ("attendance", console.AttendanceViewSet), ("points", console.PointsViewSet),
    ("results", console.ResultsViewSet), ("audit", console.AuditViewSet), ("settings", console.SettingsViewSet)]:
    router.register(prefix, view, basename="console-" + prefix)

urlpatterns = [path("attendance/daily/", daily_attendance), path("admin/dashboard/", console.dashboard), path("admin/", include(router.urls)),
    path("portal/attendance-overview/", portal.attendance_overview),
    path("portal/summary/", portal.summary), path("portal/merit/", portal.merit),
    path("portal/attendance/", portal.attendance), path("portal/event-pass/", portal.event_pass)]
