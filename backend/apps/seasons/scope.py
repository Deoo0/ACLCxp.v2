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


def require_membership(user, season=None):
    from rest_framework.exceptions import PermissionDenied
    from .models import SeasonMembership
    season = season or current_season()
    if season and user and user.role == "STUDENT":
        if season.status != "ACTIVE" or not SeasonMembership.objects.filter(season=season, user=user).exists():
            raise PermissionDenied("Activate your ticket for the active season before participating.")
