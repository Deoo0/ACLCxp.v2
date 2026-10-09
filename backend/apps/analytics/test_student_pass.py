from datetime import timedelta
from unittest.mock import patch
import base64
from django.core import signing
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError
from apps.events.tests import make_user
from apps.houses.models import House
from apps.users.models import QRCode
from apps.attendance.models import Attendance
from .models import SystemSetting
from .student_pass import issue_pass, resolve_student, SALT, confirmation
from . import tests as console_tests
from apps.seasons.testing import active_season, enroll_student

class StudentPassTests(TestCase):
    def setUp(self):
        active_season()
        self.client = APIClient()
        self.house = House.objects.create(name="Secret House", color_code="#123456", motto="secret", logo_url="https://example.com/logo.png")
        self.student = make_user("passstudent")
        self.student.first_name = "Alex"
        self.student.last_name = "Student"
        self.student.house = self.house
        self.student.save()
        enroll_student(self.student)
        self.admin = make_user("passadmin", "ADMIN")

    def test_unique_tamper_resistant_and_persistent_without_refresh(self):
        other = make_user("anotherstudent")
        token = issue_pass(self.student)
        payload = signing.loads(token, salt=SALT)
        self.assertNotIn("student_id", payload)
        self.assertNotIn("full_name", payload)
        self.assertNotEqual(payload["nonce"], signing.loads(issue_pass(other), salt=SALT)["nonce"])
        self.assertEqual(QRCode.objects.filter(user=self.student).count(), 1)
        with patch("django.core.signing.time.time", return_value=(timezone.now() + timedelta(days=365)).timestamp()):
            self.assertEqual(resolve_student(token).pk, self.student.pk)
        with self.assertRaises(ValidationError):
            resolve_student(token + "changed")
        payload["account"] = other.pk
        with self.assertRaises(ValidationError):
            resolve_student(signing.dumps(payload, salt=SALT))
        row = QRCode.objects.get(user=self.student)
        row.is_active = False
        row.save()
        with self.assertRaises(ValidationError):
            resolve_student(token)

    def test_download_image_identity_and_student_only_access(self):
        self.client.force_authenticate(self.student)
        response = self.client.get("/api/portal/event-pass/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "no-store")
        self.assertEqual(response.data["student"], {"full_name": "Alex Student", "student_id": self.student.student_id, "house_name": self.house.name})
        self.assertIn(b"<svg", base64.b64decode(response.data["image"].split(",")[1]))
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get("/api/portal/event-pass/").status_code, 403)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/portal/event-pass/").status_code, 401)

    def test_preview_is_authorized_read_only_and_displays_identity(self):
        token = issue_pass(self.student)
        for actor, expected in [(None, 401), (self.student, 403), (self.admin, 200), (make_user("passstaff", "STAFF"), 200)]:
            self.client.force_authenticate(actor)
            response = self.client.post("/api/attendance/preview/", {"token": token}, format="json")
            self.assertEqual(response.status_code, expected)
            if expected == 200:
                self.assertEqual(response.data["house_name"], self.house.name)
                self.assertEqual(response.data["full_name"], "Alex Student")
                self.assertEqual(signing.loads(response.data["identity_proof"], salt="student-identity-confirmation")["account"], self.student.pk)
        self.assertEqual(Attendance.objects.count(), 0)

    def test_visibility_persists_and_anonymizes_all_leaderboard_fields(self):
        setting = SystemSetting.objects.get(key="leaderboard_house_visibility")
        self.client.force_authenticate(self.student)
        path = f"/api/admin/settings/{setting.pk}/"
        self.assertEqual(self.client.patch(path, {"value": "false"}, format="json").status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.patch(path, {"value": "invalid"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(path, {"value": "false"}, format="json").status_code, 200)
        setting.refresh_from_db()
        self.assertEqual(setting.value, "false")
        self.client.force_authenticate(self.student)
        row = self.client.get("/api/portal/summary/").data["houses"][0]
        self.assertEqual(set(row), {"id", "name", "total_points", "rank", "identity_hidden"})
        self.assertEqual(row["name"], "House at rank 1")
        self.assertLess(row["id"], 0)
        self.assertEqual(row["total_points"], 0)
        self.assertEqual(row["rank"], 1)
        public = self.client.get("/api/houses/").data["data"][0]
        self.assertNotIn("total_points", public)
        self.assertNotIn("current_rank", public)
        setting.value = "true"
        setting.save()
        row = self.client.get("/api/portal/summary/").data["houses"][0]
        self.assertEqual(row["name"], self.house.name)
        self.assertEqual(row["color_code"], self.house.color_code)
        self.assertEqual(row["rank"], 1)

class IdentityRecordingTests(TestCase):
    setUp = console_tests.ConnectedConsoleTests.setUp
    def test_recording_requires_matching_recent_preview(self):
        token = issue_pass(self.student)
        body = {"event": self.event.pk, "token": token}
        url = "/api/admin/attendance/check_in/"
        self.assertEqual(self.client.post(url, body, format="json").status_code, 400)
        self.assertEqual(Attendance.objects.count(), 0)
        preview = self.client.post("/api/attendance/preview/", {"token": token}, format="json")
        body["identity_proof"] = confirmation(self.other)
        self.assertEqual(self.client.post(url, body, format="json").status_code, 400)
        body["identity_proof"] = preview.data["identity_proof"]
        with patch("django.core.signing.time.time", return_value=(timezone.now() + timedelta(minutes=6)).timestamp()):
            self.assertEqual(self.client.post(url, body, format="json").status_code, 400)
        self.assertEqual(self.client.post(url, body, format="json").status_code, 201)
        self.assertEqual(self.client.post(url, body, format="json").status_code, 200)
