from django.test import TestCase
from rest_framework.test import APIClient
from apps.seasons.testing import active_season
from .tests import make_user, event_data
from .models import Event, EventCategory


class AttendancePickerTests(TestCase):
    def setUp(self):
        active_season()
        self.client = APIClient()
        self.admin = make_user("attendance-picker-admin", "ADMIN")
        self.client.force_authenticate(self.admin)
        self.category = EventCategory.objects.create(name="Attendance picker", slug="attendance-picker")
        for index, mode in enumerate(("PER_EVENT", "DAILY", "NONE")):
            data = event_data(self.category)
            data.pop("category")
            data.update(title=f"Mode {index}", slug=f"mode-{index}", status="ONGOING", attendance_mode=mode)
            Event.objects.create(**data, category=self.category, organizer=self.admin)

    def test_picker_returns_only_requested_check_in_mode(self):
        response = self.client.get("/api/events/", {"status": "ONGOING", "attendance_mode": "PER_EVENT", "page_size": 12})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["data"][0]["attendance_mode"], "PER_EVENT")
        self.assertEqual(self.client.get("/api/events/").data["count"], 3)

    def test_invalid_mode_rejected_and_report_pagination_preserved(self):
        self.assertEqual(self.client.get("/api/events/", {"attendance_mode": "invalid"}).status_code, 400)
        response = self.client.get("/api/events/", {"page_size": 1})
        self.assertEqual(len(response.data["data"]), 1)
        self.assertIsNotNone(response.data["next"])
