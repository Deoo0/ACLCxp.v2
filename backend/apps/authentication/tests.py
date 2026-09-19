from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from apps.users.models import IntramuralsTicket, StudentRoster, User
from rest_framework_simplejwt.tokens import RefreshToken


class SessionSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user("SESSION", "SafePassword!2026", email="session@gmail.com", year_level=1)
        self.refresh = RefreshToken.for_user(self.user)

    def test_refresh_rotates_and_rejects_reuse(self):
        response = self.client.post("/api/auth/token/refresh/", {"refresh": str(self.refresh)})
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.data["data"]["refresh"], str(self.refresh))
        self.assertEqual(self.client.post("/api/auth/token/refresh/", {"refresh": str(self.refresh)}).status_code, 401)

    def test_password_reset_revokes_access_and_refresh(self):
        self.user.set_password("ReplacementPassword!2026")
        self.user.save()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.refresh.access_token}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)
        self.client.credentials()
        self.assertEqual(self.client.post("/api/auth/token/refresh/", {"refresh": str(self.refresh)}).status_code, 401)

    def test_disabled_account_cannot_refresh(self):
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.client.post("/api/auth/token/refresh/", {"refresh": str(self.refresh)}).status_code, 401)

    def test_logout_cannot_revoke_another_accounts_token(self):
        other = User.objects.create_user("OTHER-SESSION", "SafePassword!2026", email="other-session@gmail.com", year_level=1)
        other_token = str(RefreshToken.for_user(other))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.refresh.access_token}")
        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": other_token}).status_code, 403)
        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": str(self.refresh)}).status_code, 200)


@override_settings(REST_FRAMEWORK={"DEFAULT_THROTTLE_RATES": {"anon": "1000/hour", "ticket_verification": "1000/minute", "student_verification": "1000/minute", "account_activation": "1000/hour"}})
class TicketVerifiedRegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.roster = StudentRoster.objects.create(student_number="2026-12345", first_name="Ada", middle_name="", last_name="Lovelace", program="BSIT", year_level=1, section="A", is_eligible=True)
        self.ticket = IntramuralsTicket.objects.create(ticket_number="123456", qr_token="opaque-qr-token")

    def ticket_receipt(self, payload=None):
        response = self.client.post("/api/auth/registration/verify-ticket/", payload or {"ticket_number": "123456"}, format="json")
        self.assertEqual(response.status_code, 200)
        return response.data["data"]["verification_token"]

    def activation_receipt(self, ticket_receipt=None):
        response = self.client.post("/api/auth/registration/verify-student/", {"student_number": "2026-12345", "ticket_verification_token": ticket_receipt or self.ticket_receipt()}, format="json")
        self.assertEqual(response.status_code, 200)
        return response.data["data"]["activation_token"]

    def activate(self, receipt=None, email="ada@gmail.com"):
        return self.client.post("/api/auth/registration/activate/", {"activation_token": receipt or self.activation_receipt(), "email": email, "password": "SecurePass!2026"}, format="json")

    def test_valid_manual_ticket_and_student_activates_atomically(self):
        response = self.activate(); self.assertEqual(response.status_code, 201)
        self.roster.refresh_from_db(); self.ticket.refresh_from_db()
        self.assertIsNotNone(self.roster.account_id); self.assertEqual(self.ticket.status, IntramuralsTicket.REDEEMED); self.assertEqual(self.ticket.redeemed_by_id, self.roster.id)

    def test_valid_qr_token_and_student_activates(self):
        self.assertEqual(self.activate(self.activation_receipt(self.ticket_receipt({"qr_token": "opaque-qr-token"}))).status_code, 201)

    def test_invalid_ticket_is_rejected(self):
        response = self.client.post("/api/auth/registration/verify-ticket/", {"ticket_number": "999999"}, format="json")
        self.assertEqual(response.status_code, 400); self.assertEqual(response.data["code"], "INVALID_TICKET")

    def test_redeemed_ticket_is_rejected_without_identity_disclosure(self):
        self.activate(); response = self.client.post("/api/auth/registration/verify-ticket/", {"ticket_number": "123456"}, format="json")
        self.assertEqual(response.status_code, 409); self.assertEqual(response.data["code"], "TICKET_USED"); self.assertNotIn("Ada", response.data["message"])

    def test_unknown_student_number_is_rejected(self):
        response = self.client.post("/api/auth/registration/verify-student/", {"student_number": "2026-00000", "ticket_verification_token": self.ticket_receipt()}, format="json")
        self.assertEqual(response.status_code, 404); self.assertEqual(response.data["code"], "STUDENT_NOT_FOUND")

    def test_activated_student_number_is_rejected(self):
        self.activate(); second = IntramuralsTicket.objects.create(ticket_number="654321", qr_token="second-opaque-token")
        response = self.client.post("/api/auth/registration/verify-student/", {"student_number": "2026-12345", "ticket_verification_token": self.ticket_receipt({"ticket_number": second.ticket_number})}, format="json")
        self.assertEqual(response.status_code, 409); self.assertEqual(response.data["code"], "ACCOUNT_ACTIVATED")

    def test_tampered_receipt_cannot_activate_an_account(self):
        response = self.activate("manipulated-client-data")
        self.assertEqual(response.status_code, 400); self.assertFalse(User.objects.filter(student_id="2026-12345").exists())

    def test_second_redemption_attempt_is_rejected(self):
        receipt = self.activation_receipt(); self.assertEqual(self.activate(receipt).status_code, 201)
        # Equivalent to the losing simultaneous request: locks plus one-to-one constraints reject it.
        self.assertEqual(self.activate(receipt, "another@gmail.com").status_code, 409)

    def test_legacy_registration_endpoint_cannot_bypass_verification(self):
        response = self.client.post("/api/users/register/", {"student_id": "fake", "email": "fake@gmail.com", "password": "SecurePass!2026"}, format="json")
        self.assertEqual(response.status_code, 410)
