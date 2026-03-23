from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User
from apps.events.models import Event
from apps.results.models import EventResult

class Notification(BaseModel):
    """In-app notifications"""
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    # Content
    type = models.CharField(max_length=50, db_index=True)  # "EVENT_REMINDER", "RESULT_POSTED", etc.
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Related Entities
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)
    result = models.ForeignKey(EventResult, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Action
    action_url = models.URLField(max_length=500, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Priority
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMAL')
    
    # Expiry
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['type']),
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.type} - {self.user.student_id}"


class EmailLog(models.Model):
    """Email delivery tracking"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('BOUNCED', 'Bounced'),
        ('FAILED', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    to_email = models.EmailField(db_index=True)
    
    # Content
    subject = models.CharField(max_length=500)
    template_name = models.CharField(max_length=100, blank=True)
    
    # Related
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    
    # Provider
    provider = models.CharField(max_length=50, default='RESEND')
    provider_message_id = models.CharField(max_length=255, blank=True)
    provider_response = models.JSONField(null=True, blank=True)
    
    # Error
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    # Timestamps
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'email_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['to_email']),
            models.Index(fields=['status']),
            models.Index(fields=['event']),
        ]
    
    def __str__(self):
        return f"{self.to_email} - {self.subject} ({self.status})"
