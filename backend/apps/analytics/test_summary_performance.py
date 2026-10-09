from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.events.tests import make_user
from apps.results.models import PointsTransaction
from apps.seasons.testing import enroll_student
from . import tests as console_tests
from .portal import summary


class SummaryPerformanceTests(TestCase):
    setUp = console_tests.ConnectedConsoleTests.setUp

    def fetch(self):
        request = APIRequestFactory().get("/api/portal/summary/")
        force_authenticate(request, self.student)
        return summary(request)

    def award(self, user, points, **extra):
        return PointsTransaction.objects.create(user=user, house=user.house, points=points,
            transaction_type="MANUAL_ADJUSTMENT", reason="Performance fixture", **extra)

    def test_summary_query_budget(self):
        with CaptureQueriesContext(connection) as queries:
            response = self.fetch()
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(queries), 7)

    def test_rank_handles_zero_negative_ties_and_ignored_awards(self):
        self.award(self.student, -5)
        self.assertEqual(self.fetch().data["rank"], 2)
        self.award(self.other, -5)
        self.assertEqual(self.fetch().data["rank"], 1)
        self.award(self.other, 100, is_reversed=True)
        self.award(self.other, 100, is_approved=False)
        self.assertEqual(self.fetch().data["rank"], 1)
        third = make_user("summary-third")
        enroll_student(third)
        self.assertEqual(self.fetch().data["rank"], 2)
        self.award(self.student, 15)
        self.award(self.other, 15)
        self.assertEqual(self.fetch().data["rank"], 1)
        self.award(third, 11)
        self.assertEqual(self.fetch().data["rank"], 2)
        third.is_active = False
        third.save()
        self.assertEqual(self.fetch().data["rank"], 1)
