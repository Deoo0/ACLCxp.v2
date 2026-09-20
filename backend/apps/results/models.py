from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User
from apps.events.models import Event
from apps.houses.models import House


class MatchAnnouncement(BaseModel):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="matches")
    label = models.CharField(max_length=100, default="Match 1")
    house_one = models.ForeignKey(House, on_delete=models.PROTECT, null=True, blank=True, related_name="matches_as_one")
    house_two = models.ForeignKey(House, on_delete=models.PROTECT, null=True, blank=True, related_name="matches_as_two")
    team_one = models.CharField(max_length=100, blank=True)
    team_two = models.CharField(max_length=100, blank=True)
    source_one = models.ForeignKey("self", on_delete=models.PROTECT, null=True, blank=True, related_name="advances_to_one")
    source_two = models.ForeignKey("self", on_delete=models.PROTECT, null=True, blank=True, related_name="advances_to_two")
    winner_side = models.CharField(max_length=3, choices=[("ONE", "Side one"), ("TWO", "Side two")], blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["scheduled_at", "pk"]

    def clean(self):
        from django.core.exceptions import ValidationError
        for side in ("one", "two"):
            source = getattr(self, f"source_{side}")
            if source:
                if getattr(self, f"house_{side}_id") or getattr(self, f"team_{side}"):
                    raise ValidationError({f"source_{side}": "Choose a source match or a house/team, not both."})
                if source.event_id != self.event_id:
                    raise ValidationError({f"source_{side}": "Choose a source from the same event."})
                pending, seen = [source], set()
                while pending:
                    node = pending.pop()
                    if self.pk and node.pk == self.pk:
                        raise ValidationError("Bracket links cannot form a cycle.")
                    if node.pk in seen:
                        continue
                    seen.add(node.pk)
                    pending.extend(item for item in (node.source_one, node.source_two) if item)
        if self.source_one_id and self.source_one_id == self.source_two_id:
            raise ValidationError("The same source winner cannot occupy both sides.")
        if self.house_one_id and self.house_one_id == self.house_two_id:
            raise ValidationError({"house_two": "Choose two different houses."})
        if self.team_one and not self.house_one_id and not self.house_two_id and self.team_one.strip().casefold() == self.team_two.strip().casefold():
            raise ValidationError({"team_two": "Choose two different teams."})

    def participant(self, side, visited=None):
        visited = set(visited or ())
        if self.pk in visited:
            return None, "", "To be determined"
        visited.add(self.pk)
        source = getattr(self, f"source_{side}")
        if source:
            if source.winner_side:
                return source.participant(source.winner_side.lower(), visited)
            return None, "", f"Winner of {source.label}"
        house, team = getattr(self, f"house_{side}"), getattr(self, f"team_{side}")
        label = f"{house.name} · {team}" if house and team else (house.name if house else team or "To be determined")
        return house, team, label

    def __str__(self):
        return f"{self.event.title}: {self.team_one} vs {self.team_two}"


class EventResult(BaseModel):
    """Competition results and rankings"""

    RESULT_TYPE_CHOICES = [
        ("INDIVIDUAL", "Individual"),
        ("TEAM", "Team"),
        ("HOUSE", "House"),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="results")
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="event_results",
    )

    result_type = models.CharField(
        max_length=20, choices=RESULT_TYPE_CHOICES, default="INDIVIDUAL"
    )
    team_name = models.CharField(max_length=100, blank=True)
    house = models.ForeignKey(House, on_delete=models.PROTECT, null=True, blank=True, related_name="event_results")

    # Performance
    rank = models.IntegerField(null=True, blank=True, db_index=True)
    score = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    time_record = models.DurationField(null=True, blank=True)

    # Points
    points_awarded = models.IntegerField(default=0)

    # Verification
    is_verified = models.BooleanField(default=False, db_index=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_results",
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    # Media
    notes = models.TextField(blank=True)
    video_url = models.URLField(max_length=500, blank=True)
    photo_url = models.URLField(max_length=500, blank=True)

    posted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["event", "user"], condition=models.Q(result_type="INDIVIDUAL"), name="one_individual_result_per_event")]
        db_table = "event_results"
        ordering = ["event", "rank"]
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["user"]),
            models.Index(fields=["rank"]),
            models.Index(fields=["event", "rank"]),
        ]

    def __str__(self):
        return f"{self.event.title} - Rank {self.rank}"


class PointsTransaction(BaseModel):
    """Complete audit trail of all points awarded/deducted"""

    TRANSACTION_TYPE_CHOICES = [
        ("PARTICIPATION", "Participation"),
        ("PERFORMANCE", "Performance"),
        ("MANUAL_ADJUSTMENT", "Manual Adjustment"),
        ("PENALTY", "Penalty"),
        ("BONUS", "Bonus"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="points_transactions",
    )
    house = models.ForeignKey(
        House,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="points_transactions",
    )

    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    source_key = models.CharField(max_length=100, unique=True, null=True, blank=True)
    points = models.IntegerField()  # Can be negative

    # Source
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)
    result = models.ForeignKey(
        EventResult, on_delete=models.SET_NULL, null=True, blank=True
    )

    # Details
    reason = models.TextField()
    notes = models.TextField(blank=True)

    # Admin
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="points_created",
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="points_approved",
    )

    # Status
    is_approved = models.BooleanField(default=True, db_index=True)
    is_reversed = models.BooleanField(default=False, db_index=True)
    reversed_at = models.DateTimeField(null=True, blank=True)
    reversed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="points_reversed",
    )
    reversal_reason = models.TextField(blank=True)

    class Meta:
        db_table = "points_transactions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["house"]),
            models.Index(fields=["event"]),
            models.Index(fields=["transaction_type"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        target = self.user or self.house
        return f"{self.transaction_type} - {self.points} pts - {target}"
