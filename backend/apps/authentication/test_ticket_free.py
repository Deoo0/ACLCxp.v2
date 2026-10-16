from datetime import timedelta
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.exceptions import PermissionDenied
from apps.events.tests import make_user
from apps.events.models import Event, EventCategory
from apps.seasons.testing import active_season
from apps.users.models import StudentRoster, User, IntramuralsTicket
from apps.analytics.operations import check_in
from apps.analytics.models import AuditLog
from apps.events.services import Conflict
from apps.results.models import PointsTransaction


class TicketFreeWorkflowTests(TestCase):
    def setUp(self):
        self.season = active_season()
        self.client = APIClient()
        self.admin = make_user("FREE-ADMIN", "ADMIN")
        self.roster = StudentRoster.objects.create(student_number="FREE-STUDENT", first_name="Ada",
            last_name="Santos", program="BSIT", year_level=1)
        category = EventCategory.objects.create(name="Academic", slug="academic")
        self.event = Event.objects.create(title="IT/CS Days", slug="it-cs-days", description="Day one",
            category=category, organizer=self.admin, event_date=timezone.now().date() - timedelta(days=1),
            start_time="00:00", end_time="01:00", venue="Hall", capacity=1, status="ONGOING",
            registration_required=False, ticket_required=False, visibility="PROGRAM", allowed_programs=["BSIT", "BSCS"])

    def issue(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(f"/api/admin/roster/{self.roster.pk}/activation-code/",
                                    {"identity_verified": True}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.client.force_authenticate(None)
        return response.data["activation_code"]

    def verify(self, code, number="FREE-STUDENT"):
        return self.client.post("/api/auth/registration/verify-student/",
            {"student_number": number, "activation_code": code}, format="json")

    def activate(self):
        response = self.verify(self.issue())
        self.assertEqual(response.status_code, 200, response.data)
        token = response.data["data"]["activation_token"]
        response = self.client.post("/api/auth/registration/activate/",
            {"activation_token": token, "email": "free@gmail.com", "password": "StrongPassword!827"}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        return User.objects.get(student_id=self.roster.student_number), token

    def test_activation_workspace_attendance_and_paid_event_isolation(self):
        student, token = self.activate()
        self.client.force_authenticate(student)
        self.assertTrue(self.client.get("/api/seasons/access/").data["can_access"])
        self.assertEqual(self.client.get("/api/portal/event-pass/").status_code, 200)
        self.assertEqual(self.client.get("/api/events/").data["count"], 1)
        attendance, created = check_in(self.admin, self.event.pk, student.student_id)
        self.assertTrue(created)
        self.assertFalse(check_in(self.admin, self.event.pk, student.student_id)[1])
        self.assertEqual(PointsTransaction.objects.filter(user=student).count(), 1)
        self.event.ticket_required = True
        self.event.save()
        with self.assertRaises(PermissionDenied) as exc:
            check_in(self.admin, self.event.pk, student.student_id)
        self.assertIn("ticket", str(exc.exception))
        self.assertFalse(self.client.get("/api/seasons/access/").data["can_access"])
        self.assertTrue(AuditLog.objects.filter(action="ISSUE_ACTIVATION_CODE").exists())

    def test_student_number_alone_and_forged_code_are_rejected(self):
        response = self.client.post("/api/auth/registration/verify-student/", {"student_number": "FREE-STUDENT"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.verify("fake-code").status_code, 400)

    def test_staff_verification_and_permissions_required(self):
        url = f"/api/admin/roster/{self.roster.pk}/activation-code/"
        self.assertEqual(self.client.post(url, {}).status_code, 401)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(url, {}).status_code, 400)
        self.client.force_authenticate(make_user("FACULTY", "STAFF"))
        self.assertEqual(self.client.post(url, {"identity_verified": True}, format="json").status_code, 403)

    def test_code_is_bound_to_roster_expires_and_reissue_revokes_it(self):
        code = self.issue()
        other = StudentRoster.objects.create(student_number="OTHER-FREE", first_name="Other", last_name="Student", year_level=1)
        self.assertEqual(self.verify(code, other.student_number).status_code, 400)
        with patch("django.core.signing.time.time", return_value=timezone.now().timestamp() + 86402):
            self.assertEqual(self.verify(code).status_code, 400)
        new_code = self.issue()
        self.assertEqual(self.verify(code).status_code, 400)
        self.assertEqual(self.verify(new_code).status_code, 200)

    def test_activation_cannot_be_replayed(self):
        student, token = self.activate()
        response = self.client.post("/api/auth/registration/activate/",
            {"activation_token": token, "email": "second@gmail.com", "password": "StrongPassword!827"}, format="json")
        self.assertIn(response.status_code, (400, 409))
        self.assertEqual(User.objects.filter(student_id=student.student_id).count(), 1)

    def test_existing_ticket_free_account_can_redeem_paid_ticket(self):
        student, _ = self.activate()
        ticket = IntramuralsTicket.objects.create(ticket_number="543210", qr_token="paid-after-free")
        self.client.force_authenticate(student)
        response = self.client.post("/api/seasons/redeem/", {"ticket_number": ticket.ticket_number})
        self.assertEqual(response.status_code, 200, response.data)
        self.event.ticket_required = True
        self.event.save()
        self.assertTrue(check_in(self.admin, self.event.pk, student.student_id)[1])

    def test_daily_approval_skips_paid_event_and_records_ticket_free_event(self):
        from apps.analytics.student_pass import confirmation
        student, _ = self.activate()
        self.event.attendance_mode = "DAILY"
        self.event.save()
        Event.objects.create(title="Paid", slug="paid", description="Paid event", category=self.event.category,
            organizer=self.admin, event_date=self.event.event_date, start_time="00:00", end_time="01:00",
            venue="Hall", capacity=1, status="ONGOING", attendance_mode="DAILY", registration_required=False)
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/attendance/daily/", {"date": str(self.event.event_date),
            "student_id": student.student_id, "identity_proof": confirmation(student)}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(response.data["approved"]), 1)
        self.assertEqual(len(response.data["skipped"]), 1)
        self.assertEqual(PointsTransaction.objects.filter(user=student).count(), 1)

    def test_audience_roster_and_ticket_setting_lock(self):
        student, _ = self.activate()
        self.client.force_authenticate(student)
        student.program = "BSA"
        student.save()
        self.assertFalse(self.client.get("/api/seasons/access/").data["can_access"])
        with self.assertRaises(Conflict):
            check_in(self.admin, self.event.pk, student.student_id)
        student.program = "BSIT"
        student.save()
        check_in(self.admin, self.event.pk, student.student_id)
        self.client.force_authenticate(self.admin)
        response = self.client.patch(f"/api/events/{self.event.pk}/", {"ticket_required": True}, format="json")
        self.assertEqual(response.status_code, 409)
        self.roster.refresh_from_db()
        self.roster.is_eligible = False
        self.roster.save()
        with self.assertRaises(Conflict):
            check_in(self.admin, self.event.pk, student.student_id)
