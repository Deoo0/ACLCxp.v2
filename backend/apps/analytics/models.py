from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User

class AuditLog(models.Model):
    """Security audit trail for privileged actions"""
    
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILURE', 'Failure'),
    ]
    
    # Actor
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_email = models.EmailField(blank=True)  # Cached
    user_role = models.CharField(max_length=20, blank=True)
    
    # Action
    action = models.CharField(max_length=100, db_index=True)  # "CREATE_EVENT", "DELETE_USER"
    resource_type = models.CharField(max_length=50, db_index=True)  # "EVENT", "USER"
    resource_id = models.BigIntegerField(null=True, blank=True)
    
    # Details
    description = models.TextField()
    changes = models.JSONField(null=True, blank=True)  # Before/after values
    
    # Request Info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_method = models.CharField(max_length=10, blank=True)
    request_path = models.CharField(max_length=500, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, db_index=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['resource_type']),
            models.Index(fields=['user', 'action', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} by {self.user_email} @ {self.created_at}"


class SystemSetting(BaseModel):
    """Global system configuration"""
    
    DATA_TYPE_CHOICES = [
        ('STRING', 'String'),
        ('INTEGER', 'Integer'),
        ('BOOLEAN', 'Boolean'),
        ('JSON', 'JSON'),
    ]
    
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField()
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES)
    
    # Metadata
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, blank=True, db_index=True)
    
    # Access
    is_public = models.BooleanField(default=False, db_index=True)
    is_editable = models.BooleanField(default=True)
    
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'system_settings'
        ordering = ['category', 'key']
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    def get_typed_value(self):
        """Return value converted to appropriate type"""
        if self.data_type == 'INTEGER':
            return int(self.value)
        elif self.data_type == 'BOOLEAN':
            return self.value.lower() in ('true', '1', 'yes')
        elif self.data_type == 'JSON':
            import json
            return json.loads(self.value)
        return self.value