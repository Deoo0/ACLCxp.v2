import base64
import tempfile
from io import BytesIO
from PIL import Image
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from apps.events.tests import make_user
from .models import House


class HouseLogoTests(TestCase):
    def setUp(self):
        media = tempfile.TemporaryDirectory()
        self.addCleanup(media.cleanup)
        settings = override_settings(MEDIA_ROOT=media.name)
        settings.enable()
        self.addCleanup(settings.disable)
        self.client = APIClient()
        self.client.force_authenticate(make_user("logo-admin", "ADMIN"))

    def photo(self, format="PNG"):
        buffer = BytesIO()
        Image.new("RGB", (200, 100), "blue").save(buffer, format=format)
        return f'data:image/{"jpeg" if format == "JPEG" else "png"};base64,' + base64.b64encode(buffer.getvalue()).decode()

    def test_upload_display_replace_clear(self):
        response = self.client.post("/api/admin/houses/", {"name": "Azul", "color_code": "#0000ff", "logo_url": self.photo()}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        url = response.data["logo_url"]
        self.assertIn("/media/houses/", url)
        photo = self.client.get(url)
        self.assertEqual(photo.status_code, 200)
        self.assertEqual(photo["Content-Type"], "image/png")
        photo.close()
        self.assertEqual(self.client.get("/api/houses/").data["data"][0]["logo_url"], url)
        path = f'/api/admin/houses/{response.data["id"]}/'
        response = self.client.patch(path, {"motto": "Go!"}, format="json")
        self.assertEqual(response.data["logo_url"], url)
        response = self.client.patch(path, {"logo_url": self.photo("JPEG")}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["logo_url"].endswith(".jpg"))
        response = self.client.patch(path, {"logo_url": ""}, format="json")
        self.assertEqual(response.data["logo_url"], "")

    def test_invalid_upload_rejected_on_both_endpoints(self):
        for endpoint in ["/api/admin/houses/", "/api/houses/add/"]:
            for value in ["https://example.com/logo.png", "data:image/png;base64,aGVsbG8="]:
                response = self.client.post(endpoint, {"name": "House", "color_code": "#0000ff", "logo_url": value}, format="json")
                self.assertEqual(response.status_code, 400, response.data)

    def test_legacy_url_and_permissions(self):
        house = House.objects.create(name="Legacy", color_code="#0000ff", logo_url="https://example.com/old.png")
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/houses/").data["data"][0]["logo_url"], house.logo_url.name)
        response = self.client.patch(f"/api/admin/houses/{house.pk}/", {"logo_url": self.photo()}, format="json")
        self.assertEqual(response.status_code, 401)
