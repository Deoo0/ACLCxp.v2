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

    def test_past_matches_are_hidden(self):
        self.match.scheduled_at = timezone.now() - timedelta(hours=1)
        self.match.save()
        self.assertEqual(self.client.get("/api/competitions/?tab=matches").data["count"], 0)
