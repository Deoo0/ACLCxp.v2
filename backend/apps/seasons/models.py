from django.db import models
from django.conf import settings
from apps.core.models import BaseModel


class Season(BaseModel):
    name = models.CharField(max_length=120, unique=True)
    status = models.CharField(max_length=20, default="DRAFT", choices=[("DRAFT", "Draft"), ("REGISTRATION", "Registration open"), ("ACTIVE", "Active"), ("CLOSED", "Closed")])
    is_current = models.BooleanField(default=False)
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    exported_at = models.DateTimeField(null=True, blank=True)
    export_digest = models.CharField(max_length=64, blank=True)
    purged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["is_current"], condition=models.Q(is_current=True), name="one_current_season")]

    def __str__(self):
        return self.name


class SeasonMembership(BaseModel):
    season = models.ForeignKey(Season, on_delete=models.PROTECT, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="season_memberships")
    ticket = models.OneToOneField("users.IntramuralsTicket", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["season", "user"], name="one_membership_per_season")]
