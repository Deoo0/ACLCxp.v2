from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from django.db import IntegrityError, close_old_connections, transaction
from django.test import TestCase, TransactionTestCase, skipUnlessDBFeature
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import User
from apps.houses.models import House
from .models import Event, EventCategory, EventRegistration


def make_user(number, role="STUDENT", **extra):
    return User.objects.create_user(number, "StrongPassword!827", email=f"{number}@gmail.com", role=role,
                                    program="BSIT", year_level=1, **extra)


def event_data(category):
    return {"title": "Campus chess", "slug": "campus-chess", "description": "Chess tournament",
            "category": category.pk, "event_date": str(timezone.localdate() + timedelta(days=3)),
            "start_time": "10:00:00", "end_time": "12:00:00", "venue": "Hall", "capacity": 1,
            "status": "PUBLISHED", "allow_waitlist": True}


class EventsWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user("admin", "ADMIN")
        self.organizer = make_user("organizer", "ORGANIZER")
        self.other_organizer = make_user("other-organizer", "ORGANIZER")
        self.student = make_user("student")
        self.second = make_user("second")
        self.third = make_user("third")
        self.category = EventCategory.objects.create(name="Sports", slug="sports")
        self.client.force_authenticate(self.organizer)
        response = self.client.post("/api/events/", event_data(self.category), format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.event = Event.objects.get(pk=response.data["id"])
        self.url = f"/api/events/{self.event.pk}/"

    def register(self, user):
        self.client.force_authenticate(user)
        return self.client.post(self.url + "register/", {}, format="json")

    def cancel(self, user):
        self.client.force_authenticate(user)
        return self.client.post(self.url + "cancel-registration/", {"reason": "Schedule conflict"}, format="json")

    def test_public_browsing_hides_drafts_and_private_events(self):
        for slug, status, visibility in [("draft", "DRAFT", "PUBLIC"), ("private", "PUBLISHED", "PRIVATE")]:
            data = event_data(self.category)
            data.update(slug=slug, status=status, visibility=visibility)
            self.client.post("/api/events/", data, format="json")
        self.client.force_authenticate(None)
        response = self.client.get("/api/events/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(self.client.get("/api/events/categories/").status_code, 200)
        self.assertEqual(self.client.post(self.url + "register/", {}).status_code, 401)

    def test_organizer_ownership_and_admin_access(self):
        self.client.force_authenticate(self.other_organizer)
        self.assertEqual(self.client.patch(self.url, {"venue": "Taken"}).status_code, 403)
        self.assertEqual(self.client.get(self.url + "registrations/").status_code, 403)
        self.assertEqual(self.client.delete(self.url).status_code, 403)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post("/api/events/", event_data(self.category), format="json").status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.patch(self.url, {"venue": "Updated"}).status_code, 200)
        self.assertEqual(self.client.get(self.url + "registrations/").status_code, 200)

    def test_duplicate_registration_and_cancel_are_idempotent(self):
        first = self.register(self.student)
        self.assertEqual(first.status_code, 201)
        second = self.register(self.student)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["data"]["id"], second.data["data"]["id"])
        self.event.refresh_from_db()
        self.assertEqual(self.event.current_registered, 1)
        self.assertEqual(self.cancel(self.student).status_code, 200)
        self.assertEqual(self.cancel(self.student).status_code, 200)
        self.event.refresh_from_db()
        self.assertEqual(self.event.current_registered, 0)
        self.assertEqual(self.register(self.student).status_code, 201)
        self.assertEqual(EventRegistration.objects.count(), 1)

    def test_full_event_waitlist_and_fifo_promotion(self):
        self.register(self.student)
        response = self.register(self.second)
        self.assertEqual(response.data["data"]["status"], "WAITLISTED")
        self.register(self.third)
        self.cancel(self.student)
        self.assertEqual(EventRegistration.objects.get(user=self.second).status, "REGISTERED")
        self.assertEqual(EventRegistration.objects.get(user=self.third).status, "WAITLISTED")
        self.event.refresh_from_db()
        self.assertEqual(self.event.current_registered, 1)

    def test_full_event_without_waitlist_rejects(self):
        self.event.allow_waitlist = False
        self.event.save()
        self.register(self.student)
        self.assertEqual(self.register(self.second).status_code, 409)
        self.assertEqual(EventRegistration.objects.count(), 1)

    def test_registration_window_and_lifecycle(self):
        self.event.registration_opens_at = timezone.now() + timedelta(days=1)
        self.event.save()
        self.assertEqual(self.register(self.student).status_code, 409)
        self.event.registration_opens_at = None
        self.event.registration_closes_at = timezone.now() - timedelta(seconds=1)
        self.event.save(update_fields=["registration_opens_at", "registration_closes_at"])
        self.assertEqual(self.register(self.student).status_code, 409)
        self.event.registration_closes_at = None
        self.event.status = "ONGOING"
        self.event.save()
        self.assertEqual(self.register(self.student).status_code, 409)

    def test_audience_rules_filter_reads_and_registration(self):
        house = House.objects.create(name="Azul", color_code="#0000ff")
        self.event.visibility = "HOUSE"
        self.event.allowed_houses = [house.pk]
        self.event.allowed_programs = ["BSIT"]
        self.event.allowed_year_levels = [1]
        self.event.save()
        self.assertEqual(self.register(self.student).status_code, 404)
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.assertEqual(self.client.get("/api/events/").data["count"], 0)
        self.student.house = house
        self.student.save()
        self.assertEqual(self.register(self.student).status_code, 201)
        self.assertEqual(self.client.get("/api/events/").data["count"], 1)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/events/").data["count"], 0)

    def test_registration_cannot_impersonate_and_lists_are_private(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(self.url + "register/", {"user": self.second.pk}).status_code, 400)
        self.register(self.student)
        self.client.force_authenticate(self.second)
        self.assertEqual(self.client.get("/api/events/my-registrations/").data["count"], 0)
        self.assertEqual(self.cancel(self.second).status_code, 404)
        self.assertEqual(self.client.get(self.url + "registrations/").status_code, 403)

    def test_capacity_increase_promotes_and_shrink_is_rejected(self):
        self.register(self.student)
        self.register(self.second)
        self.client.force_authenticate(self.organizer)
        self.assertEqual(self.client.patch(self.url, {"capacity": 2}).status_code, 200)
        self.assertEqual(EventRegistration.objects.get(user=self.second).status, "REGISTERED")
        self.assertEqual(self.client.patch(self.url, {"capacity": 1}).status_code, 400)

    def test_event_cancellation_preserves_registrations_and_releases_capacity(self):
        self.register(self.student)
        self.register(self.second)
        self.client.force_authenticate(self.organizer)
        self.assertEqual(self.client.patch(self.url, {"status": "CANCELLED"}).status_code, 200)
        self.assertEqual(EventRegistration.objects.filter(status="CANCELLED").count(), 2)
        self.event.refresh_from_db()
        self.assertEqual(self.event.current_registered, 0)
        self.assertEqual(self.client.patch(self.url, {"status": "PUBLISHED"}).status_code, 409)
        self.assertEqual(self.client.delete(self.url).status_code, 409)

    def test_draft_create_publish_update_delete_and_categories(self):
        data = event_data(self.category)
        data.update(slug="draft", status="DRAFT")
        response = self.client.post("/api/events/", data, format="json")
        url = f"/api/events/{response.data['id']}/"
        self.assertEqual(self.client.patch(url, {"title": "Updated draft"}).status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(self.client.post("/api/events/categories/", {"name": "Academic", "slug": "academic"}).status_code, 403)
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/events/categories/", {"name": "Academic", "slug": "academic"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.client.delete(f"/api/events/categories/{self.category.pk}/").status_code, 409)

    def test_validation_eligibility_freeze_and_readonly_counters(self):
        self.assertEqual(self.client.patch(self.url, {"end_time": "09:00:00"}).status_code, 400)
        self.assertEqual(self.client.patch(self.url, {"capacity": 0}).status_code, 400)
        self.assertEqual(self.client.patch(self.url, {"allowed_houses": [99999]}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(self.url, {"status": "COMPLETED"}).status_code, 409)
        self.assertEqual(self.client.patch(self.url, {"current_registered": 999}).status_code, 200)
        self.event.refresh_from_db()
        self.assertEqual(self.event.current_registered, 0)
        self.register(self.student)
        self.client.force_authenticate(self.organizer)
        self.assertEqual(self.client.patch(self.url, {"allowed_programs": ["BSCS"]}, format="json").status_code, 409)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Event.objects.filter(pk=self.event.pk).update(current_registered=2)

    def test_ineligible_waitlisted_student_is_not_promoted(self):
        self.register(self.student)
        self.register(self.second)
        self.register(self.third)
        self.second.is_active = False
        self.second.save()
        self.cancel(self.student)
        self.assertEqual(EventRegistration.objects.get(user=self.second).status, "CANCELLED")
        self.assertEqual(EventRegistration.objects.get(user=self.third).status, "REGISTERED")


    def test_publish_and_complete_lifecycle_records_timestamps(self):
        data = event_data(self.category)
        data.update(slug="lifecycle", status="DRAFT")
        response = self.client.post("/api/events/", data, format="json")
        url = f"/api/events/{response.data['id']}/"
        response = self.client.patch(url, {"status": "PUBLISHED"})
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data["published_at"])
        self.assertEqual(self.client.patch(url, {"status": "ONGOING"}).status_code, 200)
        response = self.client.patch(url, {"status": "COMPLETED"})
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data["completed_at"])
        self.assertEqual(self.client.patch(url, {"title": "Rewrite history"}).status_code, 409)

    def test_cancellation_after_registration_close_does_not_promote(self):
        self.register(self.student)
        self.register(self.second)
        self.event.registration_closes_at = timezone.now() - timedelta(seconds=1)
        self.event.save(update_fields=["registration_opens_at", "registration_closes_at"])
        self.assertEqual(self.cancel(self.student).status_code, 200)
        self.assertEqual(EventRegistration.objects.get(user=self.second).status, "WAITLISTED")

    def test_cancellation_after_start_is_rejected(self):
        self.register(self.student)
        self.event.event_date = timezone.localdate() - timedelta(days=1)
        self.event.save(update_fields=["event_date"])
        self.assertEqual(self.cancel(self.student).status_code, 409)

    def test_draft_and_private_details_are_hidden_from_students(self):
        self.event.status = "DRAFT"
        self.event.save()
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.assertEqual(self.register(self.student).status_code, 404)
        self.event.status = "PUBLISHED"
        self.event.visibility = "PRIVATE"
        self.event.save()
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.assertEqual(self.register(self.student).status_code, 404)

    def test_window_validation_checks_existing_values_on_partial_update(self):
        self.event.registration_opens_at = timezone.now() + timedelta(days=1)
        self.event.save()
        response = self.client.patch(self.url, {"registration_closes_at": timezone.now().isoformat()})
        self.assertEqual(response.status_code, 400)



@skipUnlessDBFeature("has_select_for_update")
class RegistrationConcurrencyTests(TransactionTestCase):
    def setUp(self):
        organizer = make_user("organizer", "ORGANIZER")
        category = EventCategory.objects.create(name="Sports", slug="sports")
        data = event_data(category)
        data.pop("category")
        self.event = Event.objects.create(category=category, organizer=organizer, **data)
        self.users = [make_user("first"), make_user("second")]

    def race(self, user_ids):
        barrier = Barrier(2)
        def attempt(user_id):
            close_old_connections()
            try:
                client = APIClient()
                client.force_authenticate(User.objects.get(pk=user_id))
                barrier.wait(timeout=10)
                return client.post(f"/api/events/{self.event.pk}/register/", {}, format="json").status_code
            finally:
                close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as pool:
            return list(pool.map(attempt, user_ids))

    def test_last_slot_cannot_be_overbooked(self):
        self.event.allow_waitlist = False
        self.event.save()
        self.assertEqual(sorted(self.race([user.pk for user in self.users])), [201, 409])
        self.event.refresh_from_db()
        self.assertEqual(self.event.current_registered, 1)
        self.assertEqual(EventRegistration.objects.count(), 1)

    def test_simultaneous_retries_create_one_registration(self):
        self.assertEqual(sorted(self.race([self.users[0].pk] * 2)), [200, 201])
        self.assertEqual(EventRegistration.objects.count(), 1)
        self.event.refresh_from_db()
        self.assertEqual(self.event.current_registered, 1)
