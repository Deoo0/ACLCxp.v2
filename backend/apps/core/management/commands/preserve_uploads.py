from django.core.management.base import BaseCommand
from django.core.files.storage import FileSystemStorage
from apps.core.models import UploadedImage
from apps.events.models import Event, EventTeam
from apps.houses.models import House


class Command(BaseCommand):
    help = "Copy referenced local uploads into shared database storage without deleting originals."

    def handle(self, *args, **options):
        local = FileSystemStorage()
        names = set(House.objects.values_list("logo_url", flat=True))
        names.update(EventTeam.objects.values_list("photo", flat=True))
        for banner, poster in Event.all_objects.values_list("banner_image", "poster_image"):
            names.update((banner, poster))
        for name in sorted(names - {""}):
            if name.startswith(("https://", "http://")) or UploadedImage.objects.filter(name=name).exists():
                continue
            if not local.exists(name):
                self.stderr.write(f"Missing upload (restore or re-upload): {name}")
                continue
            with local.open(name, "rb") as image:
                UploadedImage.objects.create(name=name, content=image.read())
            self.stdout.write(f"Preserved {name}")
