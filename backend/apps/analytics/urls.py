from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import console, portal

router = DefaultRouter()
for prefix, view in [("users", console.UsersViewSet), ("roster", console.RosterViewSet),
    ("tickets", console.TicketsViewSet), ("houses", console.HousesViewSet),
    ("attendance", console.AttendanceViewSet), ("points", console.PointsViewSet),
    ("results", console.ResultsViewSet), ("audit", console.AuditViewSet), ("settings", console.SettingsViewSet)]:
    router.register(prefix, view, basename="console-" + prefix)

urlpatterns = [path("admin/dashboard/", console.dashboard), path("admin/", include(router.urls)),
    path("portal/summary/", portal.summary), path("portal/merit/", portal.merit),
    path("portal/attendance/", portal.attendance), path("portal/event-pass/", portal.event_pass)]
