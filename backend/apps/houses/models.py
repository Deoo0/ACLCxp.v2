
from django.db import models
from apps.core.models import BaseModel

class House(BaseModel):
    """Houses: Giallio, Vierrdy, Azul, Cahel, Roxxo"""
    
    name = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    color_code = models.CharField(max_length=7)  # Hex color: #FF4500
    logo_url = models.URLField(max_length=500, blank=True)
    motto = models.CharField(max_length=255, blank=True)
    
    # Points & Ranking
    total_points = models.IntegerField(default=0, db_index=True)
    current_rank = models.IntegerField(null=True, blank=True, db_index=True)
    
    # Statistics
    total_wins = models.IntegerField(default=0)
    total_participations = models.IntegerField(default=0)
    member_count = models.IntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    
    class Meta:
        db_table = 'houses'
        ordering = ['-total_points']
        verbose_name_plural = 'Houses'
    
    def __str__(self):
        return self.name


class HouseStanding(BaseModel):
    """Historical house leaderboard snapshots"""
    
    PERIOD_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('SEMESTER', 'Semester'),
        ('ANNUAL', 'Annual'),
    ]
    
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='standings')
    
    # Period
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Standings
    rank = models.IntegerField()
    total_points = models.IntegerField(default=0)
    points_change = models.IntegerField(default=0)
    
    # Statistics
    events_participated = models.IntegerField(default=0)
    events_won = models.IntegerField(default=0)
    win_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    snapshot_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'house_standings'
        unique_together = [['house', 'period_type', 'period_start']]
        ordering = ['-period_start', 'rank']
        indexes = [
            models.Index(fields=['period_type', '-period_start']),
            models.Index(fields=['rank']),
        ]
    
    def __str__(self):
        return f"{self.house.name} - {self.period_type} - Rank {self.rank}"

