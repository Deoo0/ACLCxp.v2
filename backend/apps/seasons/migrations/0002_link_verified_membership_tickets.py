from django.db import migrations


def link_verified_tickets(apps, schema_editor):
    Membership = apps.get_model("seasons", "SeasonMembership")
    Ticket = apps.get_model("users", "IntramuralsTicket")
    alias = schema_editor.connection.alias
    memberships = Membership.objects.using(alias)
    for membership in memberships.filter(ticket__isnull=True).iterator():
        ticket = Ticket.objects.using(alias).filter(
            season_id=membership.season_id, status="REDEEMED",
            redeemed_by__account_id=membership.user_id, redeemed_by__is_eligible=True,
        ).exclude(pk__in=memberships.filter(ticket__isnull=False).values("ticket_id")).order_by("pk").first()
        if ticket:
            memberships.filter(pk=membership.pk, ticket__isnull=True).update(ticket_id=ticket.pk)


class Migration(migrations.Migration):
    dependencies = [
        ("seasons", "0001_initial"),
        ("users", "0003_intramuralsticket_season_and_more"),
    ]
    operations = [migrations.RunPython(link_verified_tickets, migrations.RunPython.noop)]
