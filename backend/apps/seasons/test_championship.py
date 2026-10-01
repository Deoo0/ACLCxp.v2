from django.test import TestCase
from rest_framework.test import APIClient
from apps.events.tests import make_user
from apps.houses.models import House
from apps.results.models import PointsTransaction
from apps.analytics.console import effective_points, houses_with_totals
from .models import Season
from apps.users.models import IntramuralsTicket, StudentRoster
from .testing import enroll_student
from .scope import valid_membership


class ChampionshipTests(TestCase):
    def setUp(self):
        self.admin = make_user("year-admin", "ADMIN")
        self.student = make_user("year-student")
        self.house = House.objects.create(name="Blue", color_code="#0000ff")
        self.student.house = self.house
        self.student.save()
        self.first = Season.objects.create(name="Intramurals", academic_year="2026-2027", status="ACTIVE", is_current=True)
        enroll_student(self.student)
        self.award(self.first, 50)
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def award(self, season, points, **extra):
        return PointsTransaction.all_objects.create(season=season, user=self.student, house=self.house,
            points=points, reason="Award", transaction_type="BONUS", **extra)

    def switch(self, season):
        current = Season.objects.get(is_current=True)
        response = self.client.post(f"/api/seasons/{current.pk}/transition/", {"status": "CLOSED"})
        self.assertEqual(response.status_code, 200, response.data)
        response = self.client.post(f"/api/seasons/{season.pk}/transition/", {"status": "ACTIVE"})
        self.assertEqual(response.status_code, 200, response.data)

    def test_carryover_house_student_rank_and_next_year_reset(self):
        second = Season.objects.create(name="ACLC Week", academic_year="2026-2027")
        self.switch(second)
        self.assertFalse(valid_membership(self.student, second))
        self.house.refresh_from_db()
        self.assertEqual(self.house.total_points, 50)
        self.award(second, 30)
        self.award(second, 100, is_reversed=True)
        self.award(second, 100, is_approved=False)
        ticket = IntramuralsTicket.objects.create(season=second, ticket_number="999999999999", qr_token="second-ticket", status="REDEEMED", redeemed_by=StudentRoster.objects.get(account=self.student))
        enroll_student(self.student, ticket)
        self.assertEqual(houses_with_totals().get(pk=self.house.pk).actual_points, 80)
        self.client.force_authenticate(self.student)
        response = self.client.get("/api/portal/summary/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["points"], 80)
        self.assertEqual(response.data["rank"], 1)  # Two memberships must not double-count awards.
        merit = self.client.get("/api/portal/merit/")
        self.assertEqual(merit.status_code, 200, merit.data)
        self.assertEqual(merit.data["count"], 2)
        self.client.force_authenticate(self.admin)
        third = Season.objects.create(name="Next year", academic_year="2027-2028")
        self.switch(third)
        self.assertEqual(effective_points().count(), 0)
        self.house.refresh_from_db()
        self.assertEqual(self.house.total_points, 0)
        self.assertEqual(PointsTransaction.all_objects.filter(season=self.first).count(), 1)

    def test_unlinked_season_keeps_existing_isolation(self):
        second = Season.objects.create(name="Independent")
        self.switch(second)
        self.assertEqual(effective_points().count(), 0)

    def test_link_validation_permissions_and_purge_protection(self):
        season = Season.objects.create(name="Legacy", status="CLOSED")
        url = f"/api/seasons/{season.pk}/academic-year/"
        self.assertEqual(self.client.post(url, {"academic_year": "2026-2028"}).status_code, 400)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(url, {"academic_year": "2026-2027"}).status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(url, {"academic_year": "2026-2027"}).status_code, 200)
        self.assertEqual(self.client.post(url, {"academic_year": "2027-2028"}).status_code, 409)
        self.assertEqual(self.client.post(f"/api/seasons/{season.pk}/purge/", {}).status_code, 409)

    def test_draft_and_other_year_points_excluded(self):
        draft = Season.objects.create(name="Future week", academic_year="2026-2027")
        old = Season.objects.create(name="Old year", academic_year="2025-2026", status="CLOSED")
        self.award(draft, 100)
        self.award(old, 200)
        self.assertEqual(houses_with_totals().get(pk=self.house.pk).actual_points, 50)
