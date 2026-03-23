from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User
from apps.events.models import Event
from apps.houses.models import House

class EventResult(BaseModel):
    """Competition results and rankings"""
    
    RESULT_TYPE_CHOICES = [
        ('INDIVIDUAL', 'Individual'),
        ('TEAM', 'Team'),
        ('HOUSE', 'House'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='results')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='event_results')
    
    result_type = models.CharField(max_length=20, choices=RESULT_TYPE_CHOICES, default='INDIVIDUAL')
    team_name = models.CharField(max_length=100, blank=True)
    
    # Performance
    rank = models.IntegerField(null=True, blank=True, db_index=True)
    score = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    time_record = models.DurationField(null=True, blank=True)
    
    # Points
    points_awarded = models.IntegerField(default=0)
    
    # Verification
    is_verified = models.BooleanField(default=False, db_index=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_results')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Media
    notes = models.TextField(blank=True)
    video_url = models.URLField(max_length=500, blank=True)
    photo_url = models.URLField(max_length=500, blank=True)
    
    posted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'event_results'
        ordering = ['event', 'rank']
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['user']),
            models.Index(fields=['rank']),
            models.Index(fields=['event', 'rank']),
        ]
    
    def __str__(self):
        return f"{self.event.title} - Rank {self.rank}"


class PointsTransaction(BaseModel):
    """Complete audit trail of all points awarded/deducted"""
    
    TRANSACTION_TYPE_CHOICES = [
        ('PARTICIPATION', 'Participation'),
        ('PERFORMANCE', 'Performance'),
        ('MANUAL_ADJUSTMENT', 'Manual Adjustment'),
        ('PENALTY', 'Penalty'),
        ('BONUS', 'Bonus'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='points_transactions')
    house = models.ForeignKey(House, on_delete=models.SET_NULL, null=True, blank=True, related_name='points_transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    points = models.IntegerField()  # Can be negative
    
    # Source
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)
    result = models.ForeignKey(EventResult, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Details
    reason = models.TextField()
    notes = models.TextField(blank=True)
    
    # Admin
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='points_created')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='points_approved')
    
    # Status
    is_approved = models.BooleanField(default=True, db_index=True)
    is_reversed = models.BooleanField(default=False, db_index=True)
    reversed_at = models.DateTimeField(null=True, blank=True)
    reversed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='points_reversed')
    reversal_reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'points_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['house']),
            models.Index(fields=['event']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        target = self.user or self.house
        return f"{self.transaction_type} - {self.points} pts - {target}"