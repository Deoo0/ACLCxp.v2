from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User
from apps.events.models import Event

class Attendance(BaseModel):
    """QR scan records - Digital merit sheet"""
    
    SCAN_METHOD_CHOICES = [
        ('QR_CODE', 'QR Code'),
        ('MANUAL', 'Manual Entry'),
        ('BULK_IMPORT', 'Bulk Import'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendance_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    
    # Scan Details
    scanned_at = models.DateTimeField(auto_now_add=True, db_index=True)
    scanned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='scanned_attendances')
    
    scan_method = models.CharField(max_length=20, choices=SCAN_METHOD_CHOICES, default='QR_CODE')
    qr_code_used = models.TextField(blank=True)
    is_valid = models.BooleanField(default=True, db_index=True)
    validation_notes = models.TextField(blank=True)
    
    # Optional geo-location
    scan_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    scan_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    # Device info
    device_info = models.JSONField(null=True, blank=True)
    
    class Meta:
        db_table = 'attendance'
        unique_together = [['event', 'user']]
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['user']),
            models.Index(fields=['scanned_by']),
            models.Index(fields=['event', 'user']),
            models.Index(fields=['user', '-scanned_at']),
        ]
    
    def __str__(self):
        return f"{self.user.student_id} - {self.event.title} @ {self.scanned_at}"


class ScanLog(models.Model):
    """Audit trail for all QR scan attempts (including failures)"""
    
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scan_attempts')
    scanned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scans_performed')
    
    qr_code_data = models.TextField(blank=True)
    success = models.BooleanField(db_index=True)
    failure_reason = models.CharField(max_length=255, blank=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    device_info = models.JSONField(null=True, blank=True)
    
    attempted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'scan_logs'
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['user']),
            models.Index(fields=['success']),
            models.Index(fields=['-attempted_at']),
        ]