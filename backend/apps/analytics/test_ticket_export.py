import csv
import io

from django.test import TestCase
from rest_framework.test import APIClient
from apps.seasons.models import Season
from apps.seasons.testing import active_season
from apps.users.models import User, IntramuralsTicket


class TicketExportTests(TestCase):
    def setUp(self):
        self.season = active_season()
        self.admin = User.objects.create_user("EXPORTADMIN", "SafePassword!123", role="ADMIN", year_level=1, email="export@example.com")
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.url = "/api/admin/tickets/export/"

    def test_export_preserves_tokens_and_only_includes_current_available_tickets(self):
        ticket = IntramuralsTicket.objects.create(ticket_number="000123", qr_token="original-token")
        IntramuralsTicket.objects.create(ticket_number="000124", qr_token="disabled", status="DISABLED")
        IntramuralsTicket.objects.create(ticket_number="000125", qr_token="redeemed", status="REDEEMED")
        old = Season.objects.create(name="Old season", status="CLOSED")
        IntramuralsTicket.objects.create(season=old, ticket_number="000126", qr_token="old-token")
        for _ in range(2):
            response = self.client.get(self.url)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Cache-Control"], "no-store")
            rows = list(csv.reader(io.StringIO(response.content.decode("utf-8-sig"))))
            self.assertEqual(rows, [["Ticket number", "QR token"], ["000123", "original-token"]])
        ticket.refresh_from_db()
        self.assertEqual(ticket.qr_token, "original-token")
        self.assertEqual(ticket.status, "AVAILABLE")

    def test_empty_and_missing_season(self):
        self.assertEqual(self.client.get(self.url).status_code, 400)
        self.season.is_current = False
        self.season.save()
        self.assertEqual(self.client.get(self.url).status_code, 400)

    def test_only_admins_can_export(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, 401)
        for role in ("STUDENT", "STAFF", "ORGANIZER"):
            user = User.objects.create_user(role, "SafePassword!123", role=role, year_level=1, email=f"{role}@example.com")
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get(self.url).status_code, 403)
