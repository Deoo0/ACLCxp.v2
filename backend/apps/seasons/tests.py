import io
import json
import zipfile
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.events.tests import make_user, event_data
from apps.events.models import Event, EventCategory
from apps.users.models import IntramuralsTicket, StudentRoster, User
from apps.results.models import PointsTransaction, EventResult, MatchAnnouncement
from apps.attendance.models import Attendance
from apps.houses.models import House
from .models import Season, SeasonMembership


class SeasonLifecycleTests(TestCase):
    def test_open_attendance_requires_redeemed_current_season_ticket(self):
        self.adopt()
        self.event.refresh_from_db()
        self.event.registration_required = False
        self.event.status = "ONGOING"
        self.event.save()
        url = "/api/admin/attendance/check_in/"
        payload = {"event": self.event.pk, "student_id": self.student.student_id}
        old_season = Season.objects.create(name="Previous season", status="CLOSED")
        ticket = self.ticket
        ticket.season = old_season
        ticket.save()
        self.assertEqual(self.client.post(url, payload).status_code, 403)
        ticket.season = self.first
        ticket.status = "DISABLED"
        ticket.save()
        self.assertEqual(self.client.post(url, payload).status_code, 403)
        ticket.status = "REDEEMED"
        ticket.save()
        self.assertEqual(self.client.post(url, payload).status_code, 201)

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user("season-admin", "ADMIN")
        self.student = make_user("season-student")
        self.house = House.objects.create(name="Azul", color_code="#0000ff")
        self.student.house = self.house
        self.student.save()
        self.roster = StudentRoster.objects.create(student_number=self.student.student_id, first_name="Student", last_name="One", program="BSIT", year_level=1, account=self.student)
        self.ticket = IntramuralsTicket.objects.create(ticket_number="111222333444", qr_token="legacy-ticket", status="REDEEMED", redeemed_by=self.roster)
        category = EventCategory.objects.create(name="Sports", slug="sports")
        data = event_data(category)
        data.pop("category")
        self.event = Event.objects.create(**data, category=category, organizer=self.admin)
        self.points = PointsTransaction.objects.create(user=self.student, house=self.house, points=50, reason="Legacy award", transaction_type="BONUS")
        self.client.force_authenticate(self.admin)
        self.first = Season.objects.create(name="Intramurals 2026")

    def transition(self, season, status, **extra):
        return self.client.post(f"/api/seasons/{season.pk}/transition/", {"status": status, **extra}, format="json")

    def adopt(self):
        response = self.transition(self.first, "ACTIVE", adopt_existing=True)
        self.assertEqual(response.status_code, 200, response.data)

    def test_first_season_adopts_existing_records_only_after_confirmation(self):
        self.assertEqual(self.transition(self.first, "ACTIVE").status_code, 409)
        self.adopt()
        self.event.refresh_from_db()
        self.points.refresh_from_db()
        self.assertEqual(self.event.season_id, self.first.pk)
        self.assertEqual(self.points.season_id, self.first.pk)
        self.assertTrue(SeasonMembership.objects.filter(season=self.first, user=self.student).exists())
        self.client.force_authenticate(self.student)
        response = self.client.get("/api/portal/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["points"], 50)

    def test_close_blocks_existing_access_and_new_season_requires_new_ticket(self):
        self.adopt()
        old_ticket = IntramuralsTicket.objects.create(ticket_number="123456789012", qr_token="old-ticket")
        self.assertEqual(self.transition(self.first, "CLOSED").status_code, 200)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/portal/merit/").status_code, 403)
        self.assertFalse(self.client.get("/api/seasons/access/").data["can_access"])
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.patch(f"/api/events/{self.event.pk}/", {"venue": "Changed"}).status_code, 409)
        self.assertEqual(self.client.post(f"/admin/events/event/{self.event.pk}/change/", {}).status_code, 409)
        next_season = Season.objects.create(name="Intramurals 2027")
        self.assertEqual(self.transition(next_season, "REGISTRATION").status_code, 200)
        self.assertEqual(self.client.get("/api/events/").data["count"], 0)
        self.assertEqual(self.client.get("/api/admin/points/").data["count"], 0)
        self.assertEqual(self.client.get("/api/admin/tickets/").data["count"], 0)
        new_ticket = IntramuralsTicket.objects.create(ticket_number="999999999999", qr_token="new-ticket")
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post("/api/seasons/redeem/", {"ticket_number": old_ticket.ticket_number}).status_code, 400)
        self.assertEqual(self.client.post("/api/seasons/redeem/", {"ticket_number": new_ticket.ticket_number}).status_code, 200)
        self.assertEqual(self.client.get("/api/portal/summary/").status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.transition(next_season, "ACTIVE").status_code, 200)
        self.client.force_authenticate(self.student)
        summary = self.client.get("/api/portal/summary/")
        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.data["points"], 0)
        self.assertEqual(summary.data["rank"], 1)
        self.assertEqual(summary.data["houses"][0]["total_points"], 0)
        self.assertEqual(self.client.get("/api/portal/merit/").data["count"], 0)
        self.assertEqual(self.client.get("/api/events/my-registrations/").data["count"], 0)
        self.assertEqual(self.client.get(f"/api/events/{self.event.pk}/").status_code, 404)
        self.assertEqual(PointsTransaction.all_objects.filter(season=self.first).count(), 1)

    def test_export_acknowledgement_digest_and_scoped_purge(self):
        self.adopt()
        self.assertEqual(self.client.post(f"/api/seasons/{self.first.pk}/export/").status_code, 409)
        self.transition(self.first, "CLOSED")
        self.assertEqual(self.client.post(f"/api/seasons/{self.first.pk}/purge/", {}).status_code, 409)
        response = self.client.post(f"/api/seasons/{self.first.pk}/export/")
        self.assertEqual(response.status_code, 200)
        digest = response["X-Season-Export-Digest"]
        bundle = zipfile.ZipFile(io.BytesIO(response.content))
        self.assertIn("reports/attendance.csv", bundle.namelist())
        records = json.loads(bundle.read("records.json"))
        self.assertEqual(records["points"][0]["points"], 50)
        self.assertNotIn("password", records["students"][0])
        data = {"confirmation": self.first.name, "export_saved": True, "export_digest": digest}
        self.assertEqual(self.client.post(f"/api/seasons/{self.first.pk}/purge/", {**data, "confirmation": "wrong"}, format="json").status_code, 400)
        self.assertEqual(self.client.post(f"/api/seasons/{self.first.pk}/purge/", {**data, "export_digest": "stale"}, format="json").status_code, 409)
        self.assertEqual(self.client.post(f"/api/seasons/{self.first.pk}/purge/", data, format="json").status_code, 200)
        self.assertFalse(Event.all_objects.filter(season=self.first).exists())
        self.assertFalse(PointsTransaction.all_objects.filter(season=self.first).exists())
        self.assertTrue(User.objects.filter(pk=self.student.pk).exists())
        self.assertTrue(StudentRoster.objects.filter(pk=self.roster.pk).exists())
        self.assertTrue(House.objects.filter(pk=self.house.pk).exists())
        self.first.refresh_from_db()
        self.assertIsNotNone(self.first.purged_at)
        self.assertEqual(self.transition(self.first, "ACTIVE").status_code, 409)

    def test_only_admin_controls_seasons_and_one_current_season(self):
        self.adopt()
        other = Season.objects.create(name="Next")
        self.assertEqual(self.transition(other, "REGISTRATION").status_code, 409)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.transition(self.first, "CLOSED").status_code, 403)
        self.assertEqual(self.client.get("/api/seasons/").status_code, 403)

    def test_new_season_can_reuse_event_names_and_old_season_purge_preserves_new(self):
        self.adopt()
        self.transition(self.first, "CLOSED")
        next_season = Season.objects.create(name="Next season")
        self.transition(next_season, "ACTIVE")
        data = event_data(self.event.category)
        created = self.client.post("/api/events/", data, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        new_event = Event.objects.get(pk=created.data["id"])
        self.assertEqual(new_event.season_id, next_season.pk)
        self.assertEqual(self.client.patch(f"/api/events/{self.event.pk}/", {"venue": "Old"}, format="json").status_code, 404)
        response = self.client.post(f"/api/seasons/{self.first.pk}/export/")
        self.assertEqual(response.status_code, 200)
        result = self.client.post(f"/api/seasons/{self.first.pk}/purge/", {"confirmation": self.first.name, "export_saved": True, "export_digest": response["X-Season-Export-Digest"]}, format="json")
        self.assertEqual(result.status_code, 200, result.data)
        self.assertTrue(Event.all_objects.filter(pk=new_event.pk).exists())
        self.assertEqual(Event.objects.count(), 1)

    def test_new_accounts_enroll_and_tickets_cannot_be_reused(self):
        self.adopt()
        self.transition(self.first, "CLOSED")
        season = Season.objects.create(name="Account activation season")
        self.transition(season, "REGISTRATION")
        StudentRoster.objects.create(student_number="NEW-STUDENT", first_name="New", last_name="Student", program="BSIT", year_level=1)
        ticket = IntramuralsTicket.objects.create(ticket_number="234567890123", qr_token="fresh")
        self.client.force_authenticate(None)
        response = self.client.post("/api/auth/registration/verify-ticket/", {"ticket_number": ticket.ticket_number})
        receipt = response.data["data"]["verification_token"]
        response = self.client.post("/api/auth/registration/verify-student/", {"student_number": "NEW-STUDENT", "ticket_verification_token": receipt})
        activation = response.data["data"]["activation_token"]
        response = self.client.post("/api/auth/registration/activate/", {"activation_token": activation, "email": "new-student@gmail.com", "password": "StrongPassword!827"})
        self.assertEqual(response.status_code, 201, response.data)
        new_user = User.objects.get(student_id="NEW-STUDENT")
        self.assertTrue(SeasonMembership.objects.filter(season=season, user=new_user, ticket=ticket).exists())
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post("/api/seasons/redeem/", {"ticket_number": ticket.ticket_number}).status_code, 400)

    def test_stale_export_and_missing_artwork_block_purge(self):
        self.adopt()
        self.transition(self.first, "CLOSED")
        response = self.client.post(f"/api/seasons/{self.first.pk}/export/")
        digest = response["X-Season-Export-Digest"]
        PointsTransaction.all_objects.filter(pk=self.points.pk).update(reason="Changed after export")
        data = {"confirmation": self.first.name, "export_saved": True, "export_digest": digest}
        self.assertEqual(self.client.post(f"/api/seasons/{self.first.pk}/purge/", data, format="json").status_code, 409)
        Event.all_objects.filter(pk=self.event.pk).update(banner_image="events/nonexistent-season-test.png")
        response = self.client.post(f"/api/seasons/{self.first.pk}/export/")
        data["export_digest"] = response["X-Season-Export-Digest"]
        self.assertEqual(self.client.post(f"/api/seasons/{self.first.pk}/purge/", data, format="json").status_code, 409)
        self.assertTrue(Event.all_objects.filter(pk=self.event.pk).exists())
