from django.db import models
from django.db.models import Exists, Q, Subquery


def current_season():
    from .models import Season
    return Season.objects.filter(is_current=True).first()


def current_season_id():
    from .models import Season
    return Season.objects.filter(is_current=True).values_list("pk", flat=True).first()


class SeasonManager(models.Manager):
    """Scope operational queries lazily; unconfigured installations retain legacy behavior."""
    def get_queryset(self):
        from .models import Season
        current = Season.objects.filter(is_current=True)
        path = getattr(self.model, "season_lookup", "season_id")
        return super().get_queryset().alias(_season_enabled=Exists(current)).filter(
            Q(_season_enabled=False) | Q(**{path: Subquery(current.values("pk")[:1])}))


def valid_membership(user, season):
    """Membership is valid only while its own redeemed ticket belongs to this student."""
    from .models import SeasonMembership
    return bool(season and SeasonMembership.objects.filter(
        season=season, user=user, ticket__season=season, ticket__status="REDEEMED",
        ticket__redeemed_by__account=user, ticket__redeemed_by__is_eligible=True,
    ).exists())


def student_session_error(user, season=None):
    if user.role != "STUDENT":
        return None
    season = season or current_season()
    if not season or season.status not in ("REGISTRATION", "ACTIVE"):
        return {"code": "SEASON_NOT_OPEN", "message": "Student access is not open. Please wait for the school to open season registration or start the season."}
    return None


def require_membership(user, season=None):
    from rest_framework.exceptions import PermissionDenied
    season = season or current_season()
    if user and user.role == "STUDENT":
        if not season or season.status != "ACTIVE" or not valid_membership(user, season):
            raise PermissionDenied("Activate your ticket for the active season before participating.")
