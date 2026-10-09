from io import BytesIO
from uuid import uuid4
from unittest.mock import patch
from PIL import Image
from django.core.cache import caches
from django.test import TestCase, override_settings
from apps.core.models import UploadedImage


@override_settings(STORAGES={"default": {"BACKEND": "apps.core.storage.DatabaseMediaStorage"}})
class MediaPerformanceTests(TestCase):
    def setUp(self):
        caches["media"].clear()
        self.addCleanup(caches["media"].clear)
        self.filename = f"{uuid4().hex}.png"
        data = BytesIO()
        # Realistic large image with color variation, not a highly compressed block.
        Image.effect_noise((2000, 1000), 80).convert("RGB").save(data, format="PNG")
        self.original = data.getvalue()
        UploadedImage.objects.create(name=f"events/{self.filename}", content=self.original)
        self.url = f"/media/events/{self.filename}"

    def test_smaller_variants_preserve_aspect_ratio_and_cache(self):
        response = self.client.get(self.url, {"width": 640})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/jpeg")
        image = Image.open(BytesIO(response.content))
        self.assertEqual(image.size, (640, 320))
        self.assertLess(len(response.content), len(self.original) // 4)
        self.assertIn("immutable", response["Cache-Control"])
        with patch("apps.events.media.default_storage.open", side_effect=AssertionError("Cache miss")):
            cached = self.client.get(self.url, {"width": 640})
        self.assertEqual(cached.content, response.content)

    def test_conditional_request_does_not_read_storage(self):
        first = self.client.get(self.url, {"width": 320})
        with patch("apps.events.media.default_storage.open", side_effect=AssertionError("Storage accessed")):
            response = self.client.get(f"{self.url}?width=320", HTTP_IF_NONE_MATCH=first["ETag"])
        self.assertEqual(response.status_code, 304)
        self.assertEqual(response["Cross-Origin-Resource-Policy"], "cross-origin")
        self.assertEqual(response["ETag"], first["ETag"])
        # Variants have different validators and cannot return a false 304.
        response = self.client.get(f"{self.url}?width=640", HTTP_IF_NONE_MATCH=first["ETag"])
        self.assertEqual(response.status_code, 200)

    def test_original_unchanged_bad_width_and_missing_file(self):
        response = self.client.get(self.url)
        self.assertEqual(b"".join(response.streaming_content), self.original)
        response.close()
        self.assertEqual(self.client.get(self.url, {"width": "999999"}).status_code, 400)
        self.assertEqual(self.client.get(f"/media/events/{uuid4().hex}.png?width=320").status_code, 404)

    def test_transparency_and_no_upscaling(self):
        data = BytesIO()
        Image.new("RGBA", (100, 50), (255, 0, 0, 0)).save(data, format="PNG")
        UploadedImage.objects.filter(name=f"events/{self.filename}").update(content=data.getvalue())
        response = self.client.get(self.url, {"width": 320})
        self.assertEqual(response["Content-Type"], "image/png")
        image = Image.open(BytesIO(response.content))
        self.assertEqual(image.size, (100, 50))
        self.assertEqual(image.getpixel((0, 0))[3], 0)
