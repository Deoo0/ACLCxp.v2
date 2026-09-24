"""Explicit valid-season setup for tests of unrelated student functionality."""
from .models import Season, SeasonMembership
from apps.users.models import StudentRoster, IntramuralsTicket


def active_season():
    return Season.objects.get_or_create(is_current=True, defaults={"name": "Test active season", "status": "ACTIVE"})[0]


def enroll_student(user, ticket=None):
    season = active_season()
    if ticket is None:
        roster, _ = StudentRoster.objects.get_or_create(student_number=user.student_id,
            defaults={"account": user, "first_name": "Test", "last_name": "Student", "program": "BSIT", "year_level": 1})
        ticket = IntramuralsTicket.objects.create(season=season, ticket_number=f"88{user.pk:010d}",
            qr_token=f"test-ticket-{user.pk}", status="REDEEMED", redeemed_by=roster)
    SeasonMembership.objects.create(season=season, user=user, ticket=ticket)
