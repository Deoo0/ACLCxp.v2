from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import User, StudentRoster, IntramuralsTicket
from .models import Season, SeasonMembership


class StudentSeasonAccessTests(TestCase):
    password = "SeasonRegression!2026"

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user("SEASON-CHECK", self.password,
            email="season-check@example.com", year_level=1)
        self.roster = StudentRoster.objects.create(student_number=self.user.student_id,
            first_name="Test", last_name="Student", program="BSIT", year_level=1, account=self.user)
        self.refresh = RefreshToken.for_user(self.user)

    def login(self):
        return self.client.post('/api/auth/login/', {'student_id': self.user.student_id, 'password': self.password})

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')

    def enroll(self, status="ACTIVE"):
        season = Season.objects.create(name="Current", status=status, is_current=True)
        ticket = IntramuralsTicket.objects.create(ticket_number="123456789012", qr_token="current-ticket",
            season=season, status="REDEEMED", redeemed_by=self.roster)
        membership = SeasonMembership.objects.create(user=self.user, season=season, ticket=ticket)
        return season, ticket, membership

    def assert_locked(self):
        self.authenticate()
        self.assertFalse(self.client.get('/api/seasons/access/').json()['can_access'])
        for path in ['/api/portal/summary/', '/api/portal/event-pass/', '/api/events/',
                     '/api/portal/merit/', f'/api/users/{self.user.pk}/']:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 403)
        self.assertEqual(self.client.patch(f'/api/users/{self.user.pk}/', {'bio': 'bypass'}).status_code, 403)

    def test_no_season_and_non_current_draft_fail_closed(self):
        for draft in (False, True):
            if draft:
                Season.objects.create(name="Draft", status="DRAFT")
            with self.subTest(draft=draft):
                self.client.credentials()
                response = self.login()
                self.assertEqual(response.status_code, 403)
                self.assertEqual(response.json()['code'], 'SEASON_NOT_OPEN')
                self.assertNotIn('data', response.json())
                self.assertEqual(self.client.post('/api/auth/token/refresh/', {'refresh': str(self.refresh)}).status_code, 403)
                self.assert_locked()
                self.assertEqual(self.client.get('/api/auth/me/').status_code, 403)
                self.client.credentials()
                self.assertEqual(self.client.post('/api/auth/registration/verify-ticket/', {'ticket_number': '123456'}).status_code, 409)

    def test_registration_allows_only_enrollment_not_workspace(self):
        self.enroll('REGISTRATION')
        self.assertEqual(self.login().status_code, 200)
        self.assert_locked()
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 200)

    def test_draft_and_closed_reject_new_and_existing_sessions(self):
        season, _, _ = self.enroll()
        self.assertEqual(self.login().status_code, 200)
        for status in ['DRAFT', 'CLOSED']:
            season.status = status
            season.save()
            self.client.credentials()
            self.assertEqual(self.login().status_code, 403)
            self.assertEqual(self.client.post('/api/auth/token/refresh/', {'refresh': str(self.refresh)}).status_code, 403)
            self.assert_locked()
            self.assertEqual(self.client.get('/api/auth/me/').status_code, 403)

    def test_valid_ticket_allows_active_season(self):
        self.enroll()
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.json()['data']['access']}")
        self.assertTrue(self.client.get('/api/seasons/access/').json()['can_access'])
        self.assertEqual(self.client.get('/api/portal/summary/').status_code, 200)
        self.assertEqual(self.client.get('/api/portal/event-pass/').status_code, 200)

    def test_membership_without_valid_current_ticket_is_insufficient(self):
        season, ticket, membership = self.enroll()
        old = Season.objects.create(name="Old", status="CLOSED")
        other = StudentRoster.objects.create(student_number="OTHER", first_name="Other", last_name="Student", year_level=1)
        changes = [dict(status='DISABLED'), dict(status='AVAILABLE'), dict(season=old), dict(redeemed_by=other), dict(redeemed_by=None)]
        for values in changes:
            with self.subTest(values=values):
                IntramuralsTicket.all_objects.filter(pk=ticket.pk).update(status='REDEEMED', season=season, redeemed_by=self.roster)
                IntramuralsTicket.all_objects.filter(pk=ticket.pk).update(**values)
                self.assert_locked()
        IntramuralsTicket.all_objects.filter(pk=ticket.pk).update(status='REDEEMED', season=season, redeemed_by=self.roster)
        self.roster.is_eligible = False
        self.roster.save()
        self.assert_locked()
        self.roster.is_eligible = True
        self.roster.save()
        membership.ticket = None
        membership.save()
        self.assert_locked()

    def test_new_season_requires_new_ticket_and_repairs_legacy_membership(self):
        old, old_ticket, _ = self.enroll()
        old.status = 'CLOSED'
        old.is_current = False
        old.save()
        season = Season.objects.create(name='Next', status='ACTIVE', is_current=True)
        SeasonMembership.objects.create(season=season, user=self.user)
        ticket = IntramuralsTicket.objects.create(ticket_number='654321654321', qr_token='new')
        self.assert_locked()
        self.assertEqual(self.client.post('/api/seasons/redeem/', {'ticket_number': old_ticket.ticket_number}).status_code, 400)
        self.assertEqual(self.client.post('/api/seasons/redeem/', {'ticket_number': ticket.ticket_number}).status_code, 200)
        self.assertTrue(self.client.get('/api/seasons/access/').json()['can_access'])
        self.assertEqual(self.client.get('/api/portal/summary/').status_code, 200)

    def test_admin_and_staff_login_are_not_season_gated(self):
        Season.objects.create(name='Draft')
        for role in ['ADMIN', 'STAFF', 'ORGANIZER']:
            self.user.role = role
            self.user.save()
            with self.subTest(role=role):
                self.assertEqual(self.login().status_code, 200)

    def test_activation_receipt_cannot_cross_seasons(self):
        from django.core import signing
        season, ticket, membership = self.enroll('REGISTRATION')
        ticket.status = 'AVAILABLE'
        ticket.redeemed_by = None
        ticket.save()
        receipt = signing.dumps({'ticket_id': ticket.pk}, salt='intramurals-ticket-verification')
        season.is_current = False
        season.status = 'CLOSED'
        season.save()
        Season.objects.create(name='Next', status='REGISTRATION', is_current=True)
        response = self.client.post('/api/auth/registration/verify-student/', {
            'student_number': 'NEW', 'ticket_verification_token': receipt})
        self.assertEqual(response.status_code, 409)

    def test_legacy_migration_links_only_verified_same_season_tickets(self):
        from importlib import import_module
        from django.apps import apps
        from django.db import connection
        from types import SimpleNamespace
        migrate = import_module('apps.seasons.migrations.0002_link_verified_membership_tickets').link_verified_tickets
        season, ticket, membership = self.enroll()
        membership.ticket = None
        membership.save()
        ticket.status = 'DISABLED'
        ticket.save()
        migrate(apps, SimpleNamespace(connection=connection))
        membership.refresh_from_db()
        self.assertIsNone(membership.ticket_id)
        ticket.status = 'REDEEMED'
        ticket.save()
        migrate(apps, SimpleNamespace(connection=connection))
        membership.refresh_from_db()
        self.assertEqual(membership.ticket_id, ticket.pk)
        # A later season does not inherit a previous season's redeemed ticket.
        later = Season.objects.create(name='Later')
        next_membership = SeasonMembership.objects.create(season=later, user=self.user)
        migrate(apps, SimpleNamespace(connection=connection))
        next_membership.refresh_from_db()
        self.assertIsNone(next_membership.ticket_id)

    def test_first_season_adoption_does_not_grant_ticketless_accounts_access(self):
        season = Season.objects.create(name='First draft')
        admin = User.objects.create_user('ADMIN', self.password, email='admin@example.com', year_level=1, role='ADMIN')
        self.client.force_authenticate(admin)
        response = self.client.post(f'/api/seasons/{season.pk}/transition/', {'status': 'ACTIVE', 'adopt_existing': True}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(SeasonMembership.objects.filter(user=self.user, season=season).exists())
        self.client.force_authenticate(None)
        self.assert_locked()
