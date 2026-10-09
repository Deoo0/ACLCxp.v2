from django.db import migrations

def seed(apps, schema_editor):
    apps.get_model("analytics", "SystemSetting").objects.using(schema_editor.connection.alias).get_or_create(key="leaderboard_house_visibility", defaults={"value": "true", "data_type": "BOOLEAN", "description": "Reveal house identities on public leaderboards", "category": "portal", "is_public": True, "is_editable": True})

class Migration(migrations.Migration):
    dependencies = [("analytics", "0003_auditlog_season")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
