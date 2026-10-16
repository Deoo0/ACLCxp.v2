from django.db import migrations


def seed(apps, schema_editor):
    apps.get_model("analytics", "SystemSetting").objects.using(schema_editor.connection.alias).get_or_create(
        key="attendance_counts_for_houses", defaults={
            "value": "true", "data_type": "BOOLEAN",
            "description": "Include student attendance points in house totals and rankings",
            "category": "portal", "is_public": True, "is_editable": True,
        })


class Migration(migrations.Migration):
    dependencies = [("analytics", "0004_leaderboard_visibility")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
