from apps.seasons.testing import active_season, enroll_student
from datetime import timedelta
from zoneinfo import ZoneInfo
from django.core import signing
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.events.tests import make_user
from apps.events.models import Event, EventCategory, EventRegistration
from apps.attendance.models import Attendance
from apps.users.models import StudentRoster, IntramuralsTicket
from apps.results.models import PointsTransaction
from apps.seasons.models import Season, SeasonMembership
from .models import AuditLog


class DailyAttendanceTests(TestCase):
    def setUp(self):
        active_season()
        self.client = APIClient()
        self.staff = make_user("faculty", "STAFF")
        self.student = make_user("attendee")
        self.client.force_authenticate(self.staff)
        self.day = timezone.now().astimezone(ZoneInfo("Asia/Manila")).date() - timedelta(days=1)
        self.category = EventCategory.objects.create(name="Daily sports", slug="daily-sports")
        self.events = [self.event(str(i)) for i in range(4)]
        self.roster = StudentRoster.objects.create(student_number=self.student.student_id, first_name="Student",
            last_name="One", program="BSIT", year_level=1, account=self.student)
        self.ticket = IntramuralsTicket.objects.create(ticket_number="123456789012", qr_token="daily-ticket",
            status="REDEEMED", redeemed_by=self.roster)
        enroll_student(self.student, self.ticket)
        self.token = signing.dumps({"student_id": self.student.student_id}, salt="student-event-pass")
        self.url = "/api/attendance/daily/"

    def event(self, name, **overrides):
        fields = dict(title=name, slug=f"daily-{name}", category=self.category, organizer=self.staff,
            event_date=self.day, start_time="00:00", end_time="01:00", capacity=1,
            attendance_mode="DAILY", registration_required=False, status="COMPLETED", participation_points=5)
        fields.update(overrides)
        return Event.objects.create(**fields)

    def approve(self, **extra):
        return self.client.post(self.url, {"date": str(self.day), "token": self.token, **extra}, format="json")

    def test_one_scan_records_four_events_and_repeat_is_idempotent(self):
        response = self.approve()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(response.data["approved"]), 4)
        self.assertEqual(len(self.approve().data["already_recorded"]), 4)
        self.assertEqual(Attendance.objects.filter(user=self.student, scanned_by=self.staff, scan_method="QR_CODE").count(), 4)
        self.assertEqual(PointsTransaction.objects.filter(user=self.student).count(), 4)
        self.assertFalse(EventRegistration.objects.exists())
        self.assertEqual(list(Event.objects.values_list("total_attended", flat=True)), [1, 1, 1, 1])
        self.assertTrue(AuditLog.objects.filter(action="DAILY_ATTENDANCE", user=self.staff).exists())
        self.client.force_authenticate(self.student)
        overview = self.client.get("/api/portal/attendance-overview/").data
        self.assertEqual(overview["summary"]["attended"], 4)
        self.assertEqual(overview["summary"]["points"], 20)

    def test_preview_excludes_other_modes_and_uses_philippine_day(self):
        for name, attrs in [("none", {"attendance_mode": "NONE"}), ("single", {"attendance_mode": "PER_EVENT"}),
                            ("cancelled", {"status": "CANCELLED"}), ("draft", {"status": "DRAFT"}),
                            ("archived", {"archived_at": timezone.now()}), ("nextday", {"event_date": self.day + timedelta(days=1)})]:
            self.event(name, **attrs)
        included = self.event("early-morning", event_date=self.day - timedelta(days=1), start_time="20:00", end_time="21:00")
        self.event("following-morning", start_time="20:00", end_time="21:00")
        response = self.client.get(self.url, {"date": str(self.day)})
        self.assertEqual(len(response.data["events"]), 5)
        self.assertIn(included.pk, [e["id"] for e in response.data["events"]])
        self.assertEqual(len(self.approve().data["approved"]), 5)

    def test_skips_ineligible_unregistered_and_voided_without_restoring(self):
        self.events[0].allowed_programs = ["BSCS"]
        self.events[0].save()
        self.events[1].registration_required = True
        self.events[1].save()
        Attendance.objects.create(event=self.events[2], user=self.student, is_valid=False)
        response = self.approve()
        self.assertEqual(len(response.data["approved"]), 1)
        self.assertEqual(len(response.data["skipped"]), 3)
        self.assertEqual(PointsTransaction.objects.count(), 1)
        self.assertFalse(Attendance.objects.get(event=self.events[2]).is_valid)

    def test_ticket_invalid_qr_future_date_and_permissions(self):
        self.ticket.status = "DISABLED"
        self.ticket.save()
        self.assertEqual(self.approve().status_code, 403)
        self.assertFalse(Attendance.objects.exists())
        self.assertEqual(self.approve(token="invalid").status_code, 400)
        self.assertEqual(self.approve(date=str(self.day + timedelta(days=3))).status_code, 400)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.approve().status_code, 403)
        self.client.force_authenticate(None)
        self.assertEqual(self.approve().status_code, 401)

    def test_no_attendance_requirement_is_not_absent_and_blocks_scan(self):
        event = self.events[0]
        event.attendance_mode = "NONE"
        event.save()
        EventRegistration.objects.create(event=event, user=self.student)
        self.client.force_authenticate(self.student)
        data = self.client.get("/api/portal/attendance-overview/").data
        self.assertEqual(data["summary"]["absent"], 0)
        self.assertEqual(data["summary"]["total"], 0)
        self.assertEqual(data["data"][0]["status"], "NOT_REQUIRED")
        admin = make_user("daily-admin", "ADMIN")
        self.client.force_authenticate(admin)
        self.assertEqual(self.client.post("/api/admin/attendance/check_in/", {"event": event.pk, "token": self.token}).status_code, 409)

    def test_season_scope_and_closed_season(self):
        SeasonMembership.objects.filter(user=self.student).delete()
        Season.objects.update(is_current=False)
        season = Season.objects.create(name="Current", status="ACTIVE", is_current=True)
        SeasonMembership.objects.create(season=season, user=self.student, ticket=self.ticket)
        Event.all_objects.filter(pk=self.events[0].pk).update(season=season)
        self.ticket.season = season
        self.ticket.save()
        self.assertEqual(len(self.approve().data["approved"]), 1)
        season.status = "CLOSED"
        season.save()
        self.assertEqual(self.approve().status_code, 409)
