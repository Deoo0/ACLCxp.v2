from django.db import models


class BaseModel(models.Model):
    """Abstract base model with timestamps"""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UploadedImage(models.Model):
    name = models.CharField(max_length=500, unique=True)
    content = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)
