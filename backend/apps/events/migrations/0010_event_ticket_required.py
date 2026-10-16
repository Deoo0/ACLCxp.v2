from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("events", "0009_alter_event_end_time_eventteam")]
    operations = [migrations.AddField(
        model_name="event", name="ticket_required", field=models.BooleanField(default=True))]
