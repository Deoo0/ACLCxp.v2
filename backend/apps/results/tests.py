from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from apps.events.tests import make_user, event_data
from apps.events.models import Event, EventCategory
from .models import EventResult, MatchAnnouncement


class CompetitionFeedTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organizer = make_user("results-admin", "ADMIN")
        category = EventCategory.objects.create(name="Sports", slug="sports")
        data = event_data(category)
        data.pop("category")
        self.event = Event.objects.create(**data, category=category, organizer=self.organizer)
        self.result = EventResult.objects.create(event=self.event, result_type="TEAM", team_name="Azul", rank=1, score=0, is_verified=True)
        self.match = MatchAnnouncement.objects.create(event=self.event, team_one="Azul", team_two="Cahel", scheduled_at=timezone.now() + timedelta(days=1), is_published=True)

    def test_verified_results_and_upcoming_matches(self):
        response = self.client.get("/api/competitions/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"][0]["results"][0]["participant"], "Azul")
        self.assertEqual(self.client.get("/api/competitions/?tab=matches").data["count"], 1)
        self.result.is_verified = False
        self.result.save()
        self.match.is_published = False
        self.match.save()
        self.assertEqual(self.client.get("/api/competitions/").data["count"], 0)
        self.assertEqual(self.client.get("/api/competitions/?tab=matches").data["count"], 0)

    def test_public_feed_never_exposes_restricted_events_even_to_admin(self):
        self.client.force_authenticate(self.organizer)
        for changes in ({"visibility": "PRIVATE"}, {"status": "DRAFT"}, {"allowed_programs": ["BSIT"]}, {"archived_at": timezone.now()}):
            Event.objects.filter(pk=self.event.pk).update(**changes)
            self.assertEqual(self.client.get("/api/competitions/").data["count"], 0)
            Event.objects.filter(pk=self.event.pk).update(visibility="PUBLIC", status="PUBLISHED", allowed_programs=None, archived_at=None)

    def test_pending_matches_remain_visible_after_scheduled_time(self):
        self.match.scheduled_at = timezone.now() - timedelta(hours=1)
        self.match.save()
        self.assertEqual(self.client.get("/api/competitions/?tab=matches").data["count"], 1)

class MatchupManagementTests(TestCase):
    def setUp(self):
        from apps.houses.models import House
        self.client = APIClient()
        self.admin = make_user("match-admin", "ADMIN")
        self.student = make_user("match-student")
        self.client.force_authenticate(self.admin)
        category = EventCategory.objects.create(name="Games", slug="games")
        data = event_data(category)
        data.pop("category")
        self.event = Event.objects.create(**data, category=category, organizer=self.admin)
        self.one = House.objects.create(name="Azul", color_code="#0000ff")
        self.two = House.objects.create(name="Cahel", color_code="#ff8800")
        self.data = {"event": self.event.pk, "label": "Semifinal", "house_one": self.one.pk, "house_two": self.two.pk,
                     "team_one": "Blue Falcons", "team_two": "", "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(), "is_published": True}

    def test_create_publish_update_unpublish_and_delete(self):
        response = self.client.post("/api/admin/matchups/", self.data, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        path = f'/api/admin/matchups/{response.data["id"]}/'
        feed = self.client.get("/api/competitions/?tab=matches").data["data"][0]["matches"][0]
        self.assertEqual(feed["team_one"], "Azul · Blue Falcons")
        self.assertEqual(feed["team_two"], "Cahel")
        self.assertEqual(self.client.patch(path, {"team_two": "Titans"}, format="json").status_code, 200)
        self.assertEqual(self.client.patch(path, {"is_published": False}, format="json").status_code, 200)
        self.assertEqual(self.client.get("/api/competitions/?tab=matches").data["count"], 0)
        self.assertEqual(self.client.delete(path).status_code, 204)

    def test_validation_and_admin_access(self):
        for changes in [{"house_two": self.one.pk}, {"house_one": None}, {"source_one": 999999}]:
            response = self.client.post("/api/admin/matchups/", {**self.data, **changes}, format="json")
            self.assertEqual(response.status_code, 400, response.data)
        self.event.status = "DRAFT"
        self.event.save()
        self.assertEqual(self.client.post("/api/admin/matchups/", self.data, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/admin/matchups/", {**self.data, "is_published": False}, format="json").status_code, 201)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/admin/matchups/").status_code, 403)
        self.assertEqual(self.client.post("/api/admin/matchups/", self.data, format="json").status_code, 403)

    def test_named_house_results_award_points_and_display_house(self):
        self.event.status = "ONGOING"
        self.event.save()
        data = {"event": self.event.pk, "house": self.one.pk, "result_type": "TEAM", "team_name": "Blue Falcons", "rank": 1, "score": "15.50"}
        response = self.client.post("/api/admin/results/", data, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["points_awarded"], self.event.first_place_points)
        self.assertEqual(self.client.get("/api/competitions/").data["data"][0]["results"][0]["participant"], "Azul · Blue Falcons")
        self.assertEqual(self.client.post("/api/admin/results/", data, format="json").status_code, 409)

    def test_feed_includes_house_identity_and_uploaded_logo_urls(self):
        self.one.logo_url = "houses/" + "a" * 32 + ".png"
        self.one.save()
        self.client.post("/api/admin/matchups/", self.data, format="json")
        self.client.force_authenticate(self.student)
        match = self.client.get("/api/competitions/?tab=matches").data["data"][0]["matches"][0]
        self.assertEqual(match["house_one"]["id"], self.one.pk)
        self.assertEqual(match["house_one"]["color_code"], "#0000ff")
        self.assertEqual(match["house_one"]["logo_url"], "http://testserver/media/houses/" + "a" * 32 + ".png")
        self.assertEqual(match["team_one_name"], "Blue Falcons")
        EventResult.objects.create(event=self.event, result_type="HOUSE", house=self.one, rank=1, score=0, is_verified=True)
        result = self.client.get("/api/competitions/").data["data"][0]["results"][0]
        self.assertEqual(result["house"]["name"], "Azul")
        self.assertEqual(result["score"], "0.00")

    def create_match(self, **changes):
        response = self.client.post("/api/admin/matchups/", {**self.data, **changes}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        return response.data["id"]

    def pick(self, match_id, side):
        return self.client.post(f"/api/admin/matchups/{match_id}/winner/", {"winner_side": side}, format="json")

    def test_tbd_publishing_and_match_wins_without_placements(self):
        from .models import PointsTransaction
        match_id = self.create_match(house_two=None, scheduled_at=None)
        feed = self.client.get("/api/competitions/?tab=matches").data["data"][0]["matches"][0]
        self.assertEqual(feed["team_two"], "To be determined")
        self.assertIsNone(feed["scheduled_at"])
        self.assertEqual(self.pick(match_id, "ONE").status_code, 409)
        self.client.patch(f"/api/admin/matchups/{match_id}/", {"house_two": self.two.pk}, format="json")
        self.assertEqual(self.pick(match_id, "ONE").status_code, 200)
        self.assertEqual(self.pick(match_id, "ONE").status_code, 200)
        self.assertFalse(EventResult.objects.exists())
        self.assertFalse(PointsTransaction.objects.exists())
        self.assertEqual(self.client.get("/api/competitions/?tab=matches").data["count"], 0)
        completed = self.client.get("/api/competitions/?tab=match-results").data["data"][0]["matches"][0]
        self.assertEqual(completed["winner_label"], "Azul · Blue Falcons")
        self.assertEqual(self.client.get("/api/competitions/").data["count"], 0)

    def test_winners_advance_and_corrections_protect_finished_rounds(self):
        from apps.houses.models import House
        third = House.objects.create(name="Roxxo", color_code="#ff0000")
        semi = self.create_match()
        final = self.create_match(label="Final", source_one=semi, house_one=None, team_one="", house_two=third.pk, scheduled_at=None)
        match = MatchAnnouncement.objects.get(pk=final)
        self.assertEqual(match.participant("one")[2], "Winner of Semifinal")
        self.assertEqual(self.pick(semi, "ONE").status_code, 200)
        match = MatchAnnouncement.objects.get(pk=final)
        self.assertEqual(match.participant("one")[0], self.one)
        self.assertEqual(match.participant("one")[1], "Blue Falcons")
        self.assertEqual(self.pick(final, "ONE").status_code, 200)
        self.assertEqual(self.pick(semi, "TWO").status_code, 409)
        self.assertEqual(self.client.patch(f"/api/admin/matchups/{semi}/", {"team_one": "Changed"}, format="json").status_code, 400)
        self.assertEqual(self.pick(final, "").status_code, 200)
        self.assertEqual(self.pick(semi, "TWO").status_code, 200)
        self.assertEqual(MatchAnnouncement.objects.get(pk=final).participant("one")[0], self.two)
        self.assertEqual(self.pick(semi, "").status_code, 200)
        self.assertIsNone(MatchAnnouncement.objects.get(pk=final).participant("one")[0])

    def test_cycles_cross_event_sources_and_referenced_deletion_rejected(self):
        first = self.create_match()
        second = self.create_match(label="Next", house_one=None, team_one="", source_one=first, house_two=None)
        response = self.client.patch(f"/api/admin/matchups/{first}/", {"house_one": None, "team_one": "", "source_one": second}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.delete(f"/api/admin/matchups/{first}/").status_code, 409)
        response = self.client.patch(f"/api/admin/matchups/{second}/", {"source_two": first}, format="json")
        self.assertEqual(response.status_code, 400)
        other = Event.objects.create(title="Other", slug="other", category=self.event.category, organizer=self.admin, event_date=self.event.event_date, start_time="10:00", end_time="12:00", capacity=10)
        response = self.client.post("/api/admin/matchups/", {"event": other.pk, "label": "Invalid", "source_one": first}, format="json")
        self.assertEqual(response.status_code, 400)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.pick(first, "ONE").status_code, 403)
