import base64
import binascii
from uuid import uuid4
from django.core.files.base import ContentFile
from rest_framework import serializers


class EventImageField(serializers.ImageField):
    """Accept uploaded image bytes in JSON, keeping event writes atomic."""

    def to_internal_value(self, data):
        if data in (None, ""):
            return ""
        if isinstance(data, str):
            if len(data) > 7_000_000:
                raise serializers.ValidationError("Choose an image under 5 MB.")
            try:
                header, encoded = data.split(",", 1)
                if header not in ("data:image/jpeg;base64", "data:image/png;base64"):
                    raise ValueError()
                extension = "png" if "image/png" in header else "jpg"
                data = ContentFile(base64.b64decode(encoded, validate=True), name=f"upload.{extension}")
            except (ValueError, binascii.Error):
                raise serializers.ValidationError("Upload a JPG or PNG image.")
        if not hasattr(data, "size"):
            raise serializers.ValidationError("Upload a JPG or PNG image.")
        if data.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Choose an image under 5 MB.")
        image = super().to_internal_value(data)
        if image.image.format not in ("JPEG", "PNG"):
            raise serializers.ValidationError("Upload a JPG or PNG image.")
        image.name = f"{uuid4().hex}.{'jpg' if image.image.format == 'JPEG' else 'png'}"
        return image

    def to_representation(self, value):
        # Existing URL-based photos remain readable until replaced.
        if value and str(value).startswith(("https://", "http://")):
            return str(value)
        return super().to_representation(value) or ""
