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
