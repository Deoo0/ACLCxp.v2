from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User

class EventCategory(BaseModel):
    """Event categories: Sports, Academic, Cultural, etc."""
    
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    color_code = models.CharField(max_length=7, default='#2B579A')
    display_order = models.IntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    
    class Meta:
        db_table = 'event_categories'
        ordering = ['display_order', 'name']
        verbose_name_plural = 'Event Categories'
    
    def __str__(self):
        return self.name


class Event(BaseModel):
    """Main events table"""
    
    VISIBILITY_CHOICES = [
        ('PUBLIC', 'Public'),
        ('PROGRAM', 'Program-Specific'),
        ('HOUSE', 'House-Specific'),
        ('PRIVATE', 'Private'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    # Basic Info
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, db_index=True)
    description = models.TextField()
    
    # Relationships
    category = models.ForeignKey(EventCategory, on_delete=models.PROTECT, related_name='events')
    organizer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='organized_events')
    
    # Scheduling
    event_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    venue = models.CharField(max_length=200)
    
    # Registration
    capacity = models.IntegerField()
    current_registered = models.IntegerField(default=0)
    allow_waitlist = models.BooleanField(default=True)
    registration_opens_at = models.DateTimeField(null=True, blank=True)
    registration_closes_at = models.DateTimeField(null=True, blank=True)
    
    # Visibility
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='PUBLIC', db_index=True)
    allowed_programs = models.JSONField(null=True, blank=True)  # ["CS", "IT"]
    allowed_houses = models.JSONField(null=True, blank=True)    # ["PHOENIX"]
    allowed_year_levels = models.JSONField(null=True, blank=True)
    
    # Points
    participation_points = models.IntegerField(default=5)
    first_place_points = models.IntegerField(default=50)
    second_place_points = models.IntegerField(default=40)
    third_place_points = models.IntegerField(default=30)
    
    # Media
    banner_image = models.URLField(max_length=500, blank=True)
    poster_image = models.URLField(max_length=500, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', db_index=True)
    is_featured = models.BooleanField(default=False)
    
    # Metadata
    tags = models.JSONField(null=True, blank=True)
    requirements = models.TextField(blank=True)
    rules = models.TextField(blank=True)
    prizes = models.TextField(blank=True)
    
    # Statistics
    views_count = models.IntegerField(default=0)
    total_attended = models.IntegerField(default=0)
    
    # Timestamps
    published_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'events'
        ordering = ['-event_date', '-start_time']
        indexes = [
            models.Index(fields=['event_date']),
            models.Index(fields=['category']),
            models.Index(fields=['organizer']),
            models.Index(fields=['status']),
            models.Index(fields=['status', 'event_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.event_date}"
    
    @property
    def is_full(self):
        return self.current_registered >= self.capacity
    
    @property
    def available_slots(self):
        return self.capacity - self.current_registered


class EventRegistration(BaseModel):
    """Student event registrations"""
    
    STATUS_CHOICES = [
        ('REGISTERED', 'Registered'),
        ('WAITLISTED', 'Waitlisted'),
        ('ATTENDED', 'Attended'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_registrations')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REGISTERED', db_index=True)
    waitlist_position = models.IntegerField(null=True, blank=True)
    
    # Attendance
    attended = models.BooleanField(default=False, db_index=True)
    attendance_marked_at = models.DateTimeField(null=True, blank=True)
    attendance_marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
    
    # Cancellation
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    registered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'event_registrations'
        unique_together = [['event', 'user']]
        ordering = ['registered_at']
        indexes = [
            models.Index(fields=['event', 'status']),
            models.Index(fields=['user', 'attended']),
        ]
    
    def __str__(self):
        return f"{self.user.student_id} - {self.event.title} ({self.status})"