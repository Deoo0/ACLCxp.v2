"""Shared upload storage, independent of a web instance's ephemeral disk."""
from urllib.parse import quote
from django.core.files.base import ContentFile
from django.core.files.storage import Storage, FileSystemStorage
from django.utils.deconstruct import deconstructible


@deconstructible
class DatabaseMediaStorage(Storage):
    def _open(self, name, mode="rb"):
        from .models import UploadedImage
        try:
            image = UploadedImage.objects.get(name=name)
        except UploadedImage.DoesNotExist:
            return FileSystemStorage().open(name, mode)
        return ContentFile(bytes(image.content), name=name)

    def _save(self, name, content):
        from .models import UploadedImage
        UploadedImage.objects.create(name=name, content=content.read())
        return name

    def exists(self, name):
        from .models import UploadedImage
        return UploadedImage.objects.filter(name=name).exists() or FileSystemStorage().exists(name)

    def size(self, name):
        with self.open(name) as image:
            return image.size

    def delete(self, name):
        from .models import UploadedImage
        UploadedImage.objects.filter(name=name).delete()

    def url(self, name):
        return "/media/" + quote(name)
