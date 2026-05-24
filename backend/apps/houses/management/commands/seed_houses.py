from django.core.management.base import BaseCommand
from apps.houses.models import House


class Command(BaseCommand):
    help = "Seed the five ACLC houses"

    def handle(self, *args, **kwargs):
        houses = [
            {
                "name": "Giallio",
                "color_code": "#FEF74E",
                "description": "House Giallio — Yellow House",
                "motto": "To be updated",
            },
            {
                "name": "Vierrdy",
                "color_code": "#008330",
                "description": "House Vierrdy — Green House",
                "motto": "To be updated",
            },
            {
                "name": "Azul",
                "color_code": "#0884FE",
                "description": "House Azul — Blue House",
                "motto": "To be updated",
            },
            {
                "name": "Cahel",
                "color_code": "#DB5609",
                "description": "House Cahel — Orange House",
                "motto": "To be updated",
            },
            {
                "name": "Roxxo",
                "color_code": "#E20F16",
                "description": "House Roxxo — Red House",
                "motto": "To be updated",
            },
        ]

        for house_data in houses:
            house, created = House.objects.get_or_create(
                name=house_data["name"], defaults=house_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Created house: {house.name}"))
            else:
                self.stdout.write(
                    self.style.WARNING(f"⚠️  Already exists: {house.name}")
                )

        self.stdout.write(self.style.SUCCESS("\nDone. All houses seeded."))
