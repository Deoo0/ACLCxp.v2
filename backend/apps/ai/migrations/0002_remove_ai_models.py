from django.db import migrations


class Migration(migrations.Migration):
    """Drops AI tables and their contents; back up before applying.

    Reversing recreates empty tables, not the deleted records.
    """

    dependencies = [("ai", "0001_initial")]

    operations = [
        migrations.DeleteModel(name="AIChatMessage"),
        migrations.DeleteModel(name="AIRecommendation"),
    ]
