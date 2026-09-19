import uuid
from datetime import timedelta
from django.core import signing
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import User, StudentRoster, IntramuralsTicket
from apps.events.models import Event, EventCategory, EventRegistration
from apps.houses.models import House
from apps.attendance.models import Attendance
from apps.results.models import PointsTransaction, EventResult
from .models import AuditLog, SystemSetting


class ConnectedConsoleTests(TestCase):
    def test_account_filters_combine_and_options_cover_all_accounts(self):
        self.student.program = "BSIT"
        self.student.year_level = 2
        self.student.save()
        params = {"role": "STUDENT", "house": self.house.pk, "program": "BSIT", "year_level": 2, "is_active": "true"}
        response = self.client.get("/api/admin/users/", params)
        self.assertEqual([row["id"] for row in response.data["data"]], [self.student.pk])
        self.assertEqual(self.client.get("/api/admin/users/", {**params, "is_active": "false"}).data["count"], 0)
        self.assertEqual(self.client.get("/api/admin/users/", {"house": "unassigned", "role": "STUDENT"}).data["count"], 1)
        options = self.client.get("/api/admin/users/filter-options/")
        self.assertIn("BSIT", options.data["programs"])
        self.assertIn(2, options.data["year_levels"])
        self.assertEqual(self.client.get("/api/admin/users/", {"year_level": "invalid"}).status_code, 400)
        self.assertEqual(self.client.get("/api/admin/users/", {"role": "invalid"}).status_code, 400)

    def test_archive_hides_workspace_records_preserves_student_history_and_restores(self):
        self.check_in()
        self.event.status = "COMPLETED"
        self.event.save()
        url = f"/api/events/{self.event.pk}/archive/"
        self.assertEqual(self.client.post(url, {"archived": True}, format="json").status_code, 200)
        self.assertEqual(self.client.post(url, {"archived": True}, format="json").status_code, 200)
        self.assertEqual(self.client.get("/api/events/").data["count"], 0)
        self.assertEqual(self.client.get("/api/admin/attendance/").data["count"], 0)
        self.assertEqual(self.client.get("/api/admin/attendance/", {"archive": "archived"}).data["count"], 1)
        self.assertEqual(self.client.get("/api/events/", {"archive": "archived"}).data["count"], 1)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/portal/summary/").data["points"], 5)
        self.assertEqual(self.client.get("/api/portal/attendance/").data["count"], 1)
        self.assertEqual(self.client.get("/api/events/my-registrations/").data["count"], 1)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(url, {"archived": False}, format="json").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/attendance/").data["count"], 1)

    def test_archive_requires_admin_and_closed_event(self):
        url = f"/api/events/{self.event.pk}/archive/"
        self.assertEqual(self.client.post(url, {"archived": True}, format="json").status_code, 409)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(url, {"archived": True}, format="json").status_code, 403)
        self.assertEqual(self.client.post("/api/events/archive-year/", {"year": 2026}).status_code, 403)
        self.assertEqual(self.client.get("/api/events/filter-options/").status_code, 403)
        self.assertEqual(self.client.get("/api/admin/users/filter-options/").status_code, 403)

    def test_year_archive_is_scoped_and_keeps_open_events(self):
        closed = Event.objects.create(title="Old tournament", slug="old-tournament", category=self.event.category, organizer=self.admin,
            event_date=self.event.event_date, start_time="10:00", end_time="12:00", capacity=10, status="COMPLETED")
        response = self.client.post("/api/events/archive-year/", {"year": self.event.event_date.year})
        self.assertEqual(response.data, {"archived": 1, "kept_active": 1})
        closed.refresh_from_db()
        self.event.refresh_from_db()
        self.assertIsNotNone(closed.archived_at)
        self.assertIsNone(self.event.archived_at)
        self.assertEqual(self.client.post("/api/events/archive-year/", {"year": self.event.event_date.year}).data["archived"], 0)
        self.assertEqual(self.client.get("/api/events/", {"archive": "all", "year": self.event.event_date.year - 1}).data["count"], 0)

    def test_attendance_export_matches_all_report_filters(self):
        self.student.program = "BSIT"
        self.student.save()
        self.check_in()
        self.event.status = "COMPLETED"
        self.event.archived_at = timezone.now()
        self.event.save()
        params = {"archive": "archived", "year": self.event.event_date.year, "house": self.house.pk,
            "program": "BSIT", "year_level": 1, "is_valid": "true", "search": "STUDENT"}
        self.assertEqual(self.client.get("/api/admin/attendance/", params).data["count"], 1)
        response = self.client.get("/api/admin/attendance/export/", params)
        content = b"".join(response.streaming_content).decode()
        self.assertIn("STUDENT", content)
        self.assertIn("BSIT", content)
        response = self.client.get("/api/admin/attendance/export/", {**params, "program": "BSCS"})
        self.assertNotIn("STUDENT", b"".join(response.streaming_content).decode())
        self.assertEqual(self.client.get("/api/admin/attendance/", {"archive": "invalid"}).status_code, 400)

    def test_delete_unused_student_retains_disabled_roster_and_used_ticket(self):
        self.other.house = self.house
        self.other.save()
        roster = StudentRoster.objects.create(student_number="OTHER", first_name="Grace", last_name="Cruz", program="BSIT", year_level=1, account=self.other)
        ticket = IntramuralsTicket.objects.create(ticket_number="123456123456", qr_token="delete-test", status="REDEEMED", redeemed_by=roster)
        user_id = self.other.pk
        response = self.client.delete(f"/api/admin/users/{user_id}/")
        self.assertEqual(response.status_code, 204, getattr(response, "data", None))
        self.assertFalse(User.objects.filter(pk=user_id).exists())
        roster.refresh_from_db()
        ticket.refresh_from_db()
        self.assertIsNone(roster.account_id)
        self.assertFalse(roster.is_eligible)
        self.assertEqual(ticket.status, "REDEEMED")
        self.assertTrue(AuditLog.objects.filter(action=f"DELETE /api/admin/users/{user_id}/", status="SUCCESS").exists())

    def test_delete_student_blocks_history_and_non_students(self):
        for user in (self.student, self.admin):
            self.assertEqual(self.client.delete(f"/api/admin/users/{user.pk}/").status_code, 409)
            self.assertTrue(User.objects.filter(pk=user.pk).exists())
        self.assertEqual(EventRegistration.objects.filter(user=self.student).count(), 1)

    def test_delete_house_requires_no_members_history_or_event_restrictions(self):
        self.assertEqual(self.client.delete(f"/api/admin/houses/{self.house.pk}/").status_code, 409)
        empty = House.objects.create(name="Unused", color_code="#112233")
        self.event.allowed_houses = [empty.pk]
        self.event.save()
        url = f"/api/admin/houses/{empty.pk}/"
        self.assertEqual(self.client.delete(url).status_code, 409)
        self.event.allowed_houses = []
        self.event.save()
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(House.objects.filter(pk=empty.pk).exists())

    def test_house_and_student_points_history_survive_delete_attempts(self):
        body = {"idempotency_key": str(uuid.uuid4()), "user": self.other.pk, "points": 10, "reason": "Service award"}
        self.assertEqual(self.client.post("/api/admin/points/award/", body, format="json").status_code, 201)
        self.assertEqual(self.client.delete(f"/api/admin/users/{self.other.pk}/").status_code, 409)
        empty = House.objects.create(name="Historical", color_code="#112233")
        body = {"idempotency_key": str(uuid.uuid4()), "house": empty.pk, "points": 10, "reason": "Team award"}
        self.assertEqual(self.client.post("/api/admin/points/award/", body, format="json").status_code, 201)
        self.assertEqual(self.client.delete(f"/api/admin/houses/{empty.pk}/").status_code, 409)
        self.assertEqual(PointsTransaction.objects.count(), 2)

    def test_deletes_require_admin(self):
        for identity, status in ((None, 401), (self.student, 403)):
            self.client.force_authenticate(identity)
            self.assertEqual(self.client.delete(f"/api/admin/users/{self.other.pk}/").status_code, status)
            self.assertEqual(self.client.delete(f"/api/admin/houses/{self.house.pk}/").status_code, status)

    def setUp(self):
        self.client = APIClient()
        self.house = House.objects.create(name="Azul", color_code="#123456")
        self.admin = User.objects.create_user("ADMIN", "SafePassword!123", email="admin@gmail.com", year_level=1, role="ADMIN")
        self.student = User.objects.create_user("STUDENT", "SafePassword!123", email="student@gmail.com", year_level=1, role="STUDENT", house=self.house)
        self.other = User.objects.create_user("OTHER", "SafePassword!123", email="other@gmail.com", year_level=1, role="STUDENT")
        category = EventCategory.objects.create(name="Sport", slug="sport")
        self.event = Event.objects.create(title="Chess", slug="chess", description="Tournament", category=category, organizer=self.admin,
            event_date=timezone.localdate()+timedelta(days=1), start_time="10:00", end_time="12:00", venue="Hall", capacity=10,
            current_registered=1, status="ONGOING", participation_points=5, first_place_points=50)
        EventRegistration.objects.create(user=self.student, event=self.event)
        self.client.force_authenticate(self.admin)

    def check_in(self, token=None):
        return self.client.post("/api/admin/attendance/check_in/", {"event": self.event.pk, **({"token": token} if token else {"student_id": self.student.student_id})}, format="json")

    def test_admin_routes_reject_students_and_anonymous(self):
        for identity, expected in [(None,401),(self.student,403)]:
            self.client.force_authenticate(identity)
            for resource in ["users", "roster", "tickets", "houses", "attendance", "points", "results", "settings", "audit", "dashboard"]:
                self.assertEqual(self.client.get(f"/api/admin/{resource}/").status_code, expected, resource)
            self.assertEqual(self.client.post("/api/admin/points/award/", {}, format="json").status_code, expected)
            self.assertEqual(self.check_in().status_code, expected)

    def test_checkin_points_student_merit_and_retries(self):
        response = self.check_in()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.check_in().status_code, 200)
        self.assertEqual(Attendance.objects.count(), 1)
        self.assertEqual(PointsTransaction.objects.count(), 1)
        self.event.refresh_from_db()
        self.assertEqual(self.event.total_attended, 1)
        self.assertEqual(EventRegistration.objects.get(user=self.student).status, "ATTENDED")
        self.client.force_authenticate(self.student)
        response = self.client.get("/api/portal/summary/")
        self.assertEqual(response.data["points"], 5)
        self.assertEqual(response.data["houses"][0]["total_points"], 5)
        self.assertEqual(self.client.get("/api/portal/merit/").data["count"], 1)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/portal/merit/").data["count"], 0)

    def test_valid_qr_and_invalid_signature(self):
        token = signing.dumps({"student_id": self.student.student_id}, salt="student-event-pass")
        self.assertEqual(self.check_in(token).status_code, 201)
        self.assertEqual(self.check_in(token+"tampered").status_code, 400)
        self.client.force_authenticate(self.student)
        response = self.client.get("/api/portal/event-pass/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["image"].startswith("data:image/svg+xml;base64,"))
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_checkin_requires_ongoing_and_confirmed_registration(self):
        response = self.client.post("/api/admin/attendance/check_in/", {"event": self.event.pk,"student_id":self.other.student_id})
        self.assertEqual(response.status_code, 409)
        self.event.status="PUBLISHED"
        self.event.save()
        self.assertEqual(self.check_in().status_code, 409)

    def test_attendance_void_restore_updates_both_totals_once(self):
        row = self.check_in().data
        url = f"/api/admin/attendance/{row['id']}/correct/"
        for _ in range(2):
            self.assertEqual(self.client.post(url, {"is_valid":False,"reason":"Wrong check-in"},format="json").status_code,200)
        self.house.refresh_from_db()
        self.assertEqual(self.house.total_points,0)
        self.assertTrue(PointsTransaction.objects.get().is_reversed)
        self.assertEqual(self.client.post(url, {"is_valid":True,"reason":"Confirmed attendance"},format="json").status_code,200)
        self.house.refresh_from_db()
        self.assertEqual(self.house.total_points,5)
        self.assertEqual(PointsTransaction.objects.count(),1)

    def test_manual_award_retries_conflicts_and_reversal(self):
        body={"idempotency_key":str(uuid.uuid4()),"user":self.student.pk,"points":20,"reason":"Volunteer contribution"}
        response=self.client.post("/api/admin/points/award/",body,format="json")
        self.assertEqual(response.status_code,201,response.data)
        self.assertEqual(self.client.post("/api/admin/points/award/",body,format="json").status_code,200)
        self.assertEqual(self.client.post("/api/admin/points/award/",{**body,"points":30},format="json").status_code,409)
        url=f"/api/admin/points/{response.data['id']}/reverse/"
        for _ in range(2): self.assertEqual(self.client.post(url,{"reason":"Entry correction"}).status_code,200)
        self.house.refresh_from_db()
        self.assertEqual(self.house.total_points,0)
        self.assertEqual(PointsTransaction.objects.count(),1)

    def test_result_awards_and_corrections(self):
        self.check_in()
        body={"event":self.event.pk,"user":self.student.pk,"result_type":"INDIVIDUAL","rank":1}
        response=self.client.post("/api/admin/results/",body,format="json")
        self.assertEqual(response.status_code,201,response.data)
        self.assertIn(self.client.post("/api/admin/results/",body,format="json").status_code,(400,409))
        url=f"/api/admin/results/{response.data['id']}/correct/"
        self.assertEqual(self.client.post(url,{"rank":2,"reason":"Judges corrected placement"}).status_code,200)
        self.assertEqual(self.client.post(url,{"rank":2,"reason":"Retry same placement"}).status_code,200)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/portal/summary/").data["points"],45)
        self.assertEqual(PointsTransaction.objects.count(),3)

    def test_roster_import_is_atomic_and_tickets_can_be_disabled(self):
        csv="student_number,first_name,last_name,program,year_level\nR1,Ada,Santos,BSIT,1\nR2,Grace,Cruz,BSIT,2"
        response=self.client.post("/api/admin/roster/bulk/",{"csv":csv},format="json")
        self.assertEqual(response.status_code,201,response.data)
        self.assertEqual(StudentRoster.objects.count(),2)
        response=self.client.post("/api/admin/roster/bulk/",{"rows":[{"student_number":"R3","first_name":"A","last_name":"B","program":"BSIT","year_level":1},{"student_number":"R4"}]},format="json")
        self.assertEqual(response.status_code,400)
        self.assertFalse(StudentRoster.objects.filter(student_number="R3").exists())
        response=self.client.post("/api/admin/tickets/generate/",{"count":2},format="json")
        self.assertEqual(response.status_code,201)
        self.assertEqual(IntramuralsTicket.objects.count(),2)
        row=response.data[0]
        self.assertEqual(self.client.post(f"/api/admin/tickets/{row['id']}/toggle/",{}).data["status"],"DISABLED")

    def test_settings_control_student_portal_and_registration(self):
        setting=SystemSetting.objects.get(key="announcement")
        self.assertEqual(self.client.patch(f"/api/admin/settings/{setting.pk}/",{"value":"Welcome to intramurals"}).status_code,200)
        setting=SystemSetting.objects.get(key="registration_enabled")
        self.client.patch(f"/api/admin/settings/{setting.pk}/",{"value":"false"})
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/portal/summary/").data["settings"]["announcement"],"Welcome to intramurals")
        self.event.status="PUBLISHED"
        self.event.save()
        self.assertEqual(self.client.post(f"/api/events/{self.event.pk}/register/",{},format="json").status_code,409)

    def test_admin_cannot_disable_self_and_audit_excludes_passwords(self):
        self.assertEqual(self.client.patch(f"/api/admin/users/{self.admin.pk}/",{"is_active":False},format="json").status_code,400)
        response=self.client.patch(f"/api/admin/users/{self.student.pk}/",{"password":"NewSecure!Password729"})
        self.assertEqual(response.status_code,200,response.data)
        self.assertTrue(AuditLog.objects.exists())
        self.assertNotIn("NewSecure!",str(list(AuditLog.objects.values())))

    def test_export_is_admin_only_and_escapes_formulas(self):
        self.event.title="=DANGEROUS()"
        self.event.save()
        self.check_in()
        response=self.client.get("/api/admin/attendance/export/")
        self.assertEqual(response.status_code,200)
        content=b"".join(response.streaming_content).decode()
        self.assertIn("'=DANGEROUS()",content)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/admin/attendance/export/").status_code,403)

    def test_account_edit_can_keep_or_clear_unassigned_house(self):
        response = self.client.patch(f"/api/admin/users/{self.other.pk}/", {"house_id": None, "first_name": "Grace"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        response = self.client.patch(f"/api/admin/users/{self.student.pk}/", {"house_id": None}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.student.refresh_from_db()
        self.assertIsNone(self.student.house_id)

    def test_legacy_account_endpoint_cannot_demote_self(self):
        response = self.client.patch(f"/api/users/{self.admin.pk}/", {"role": "STUDENT"}, format="json")
        self.assertEqual(response.status_code, 400)
