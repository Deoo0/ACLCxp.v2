from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User
from apps.events.models import Event

class AIRecommendation(BaseModel):
    """Cached AI-generated event recommendations"""
    
    FEEDBACK_CHOICES = [
        ('HELPFUL', 'Helpful'),
        ('NOT_HELPFUL', 'Not Helpful'),
        ('IRRELEVANT', 'Irrelevant'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ai_recommendations')
    
    # AI Score
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4)  # 0.0000 to 1.0000
    reasoning = models.TextField(blank=True)
    
    # User Interaction
    viewed = models.BooleanField(default=False)
    clicked = models.BooleanField(default=False)
    registered = models.BooleanField(default=False)
    attended = models.BooleanField(default=False)
    
    # Feedback
    user_feedback = models.CharField(max_length=20, choices=FEEDBACK_CHOICES, null=True, blank=True)
    feedback_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    recommendation_batch = models.CharField(max_length=50, blank=True)  # "2026-02-weekly-batch"
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
    class Meta:
        db_table = 'ai_recommendations'
        unique_together = [['user', 'event', 'recommendation_batch']]
        ordering = ['-confidence_score', '-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['event']),
            models.Index(fields=['-confidence_score']),
            models.Index(fields=['recommendation_batch']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Recommendation for {self.user.student_id} - {self.event.title} ({self.confidence_score})"


class AIChatMessage(models.Model):
    """AI chatbot conversation history"""
    
    ROLE_CHOICES = [
        ('USER', 'User'),
        ('ASSISTANT', 'Assistant'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    session_id = models.CharField(max_length=100, db_index=True)  # UUID
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # AI Metadata
    model = models.CharField(max_length=50, blank=True)  # "gemini-1.5-flash"
    tokens_used = models.IntegerField(null=True, blank=True)
    response_time_ms = models.IntegerField(null=True, blank=True)
    
    # Context
    context_event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'ai_chat_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_id']),
            models.Index(fields=['user', 'session_id', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.role} - {self.user.student_id} @ {self.created_at}"