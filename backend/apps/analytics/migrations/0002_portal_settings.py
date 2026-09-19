from django.db import migrations


def seed(apps, schema_editor):
    Setting = apps.get_model("analytics", "SystemSetting")
    for key, value, kind, description in [
        ("announcement", "", "STRING", "Announcement shown on the student dashboard"),
        ("support_email", "", "STRING", "Student support email address"),
        ("merit_milestone", "300", "INTEGER", "Points per student milestone"),
        ("registration_enabled", "true", "BOOLEAN", "Allow new event registrations"),
    ]:
        Setting.objects.using(schema_editor.connection.alias).get_or_create(key=key, defaults={
            "value": value, "data_type": kind, "description": description,
            "category": "portal", "is_public": True, "is_editable": True})


class Migration(migrations.Migration):
    dependencies = [("analytics", "0001_initial")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
