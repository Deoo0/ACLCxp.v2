from apps.seasons.testing import active_season, enroll_student
from django.test import TestCase
from rest_framework.test import APIClient
from apps.houses.models import House
from .models import User


class PermissionTests(TestCase):
    def setUp(self):
        active_season()
        self.client = APIClient()
        self.student = User.objects.create_user("S1", "StrongPass!876", email="one@gmail.com", year_level=1)
        enroll_student(self.student)
        self.other = User.objects.create_user("S2", "StrongPass!876", email="two@gmail.com", year_level=1)
        enroll_student(self.other)
        self.admin = User.objects.create_user("A1", "StrongPass!876", email="admin@gmail.com", year_level=1, role="ADMIN")

    def test_anonymous_cannot_read_or_edit_users_or_create_house(self):
        self.assertEqual(self.client.get("/api/users/list/").status_code, 401)
        self.assertEqual(self.client.patch(f"/api/users/{self.student.pk}/", {"bio": "changed"}).status_code, 401)
        self.assertEqual(self.client.post("/api/houses/add/", {"name": "intruder"}).status_code, 401)
        self.assertEqual(self.client.get("/api/users/echo/").status_code, 401)

    def test_public_routes_remain_public(self):
        self.assertEqual(self.client.get("/api/houses/").status_code, 200)
        self.assertEqual(self.client.get("/api/users/health/").status_code, 200)

    def test_student_can_only_edit_own_safe_fields(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.patch(f"/api/users/{self.student.pk}/", {"bio": "Hello"}).status_code, 200)
        self.student.refresh_from_db()
        self.assertEqual(self.student.bio, "Hello")
        self.assertEqual(self.client.patch(f"/api/users/{self.other.pk}/", {"bio": "changed"}).status_code, 403)
        for field, value in {"role": "ADMIN", "house_id": 999, "program": "BSCS", "password": "plaintext", "is_superuser": True}.items():
            response = self.client.patch(f"/api/users/{self.student.pk}/", {field: value}, format="json")
            self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(self.client.get("/api/users/list/").status_code, 403)
        self.assertEqual(self.client.post("/api/houses/add/", {}).status_code, 403)

    def test_admin_password_is_hashed_validated_and_never_returned(self):
        self.client.force_authenticate(self.admin)
        url = f"/api/users/{self.student.pk}/"
        self.assertEqual(self.client.patch(url, {"password": "123"}).status_code, 400)
        response = self.client.patch(url, {"password": "NewStrong!Password827"})
        self.assertEqual(response.status_code, 200)
        self.student.refresh_from_db()
        self.assertTrue(self.student.check_password("NewStrong!Password827"))
        self.assertNotIn("password", response.data["data"])

    def test_admin_list_is_paginated_and_role_admin_can_create_house(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/users/list/?page_size=1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 3)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertIsNotNone(response.data["next"])
        self.assertEqual(self.client.post("/api/houses/add/", {"name": "Azul", "color_code": "#0000ff"}).status_code, 201)
        self.assertEqual(House.objects.count(), 1)


    def test_jwt_authentication_applies_same_permissions(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        for user, expected in [(self.student, 403), (self.admin, 200)]:
            token = str(RefreshToken.for_user(user).access_token)
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            self.assertEqual(self.client.get("/api/users/list/").status_code, expected)
