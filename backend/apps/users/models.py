from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from apps.core.models import BaseModel
from apps.houses.models import House

class UserManager(BaseUserManager):
    """Custom user manager"""
    
    def create_user(self, student_id, password=None, **extra_fields):
        if not student_id:
            raise ValueError('Student ID is required')
        
        email = extra_fields.get('email')
        if email:
            extra_fields['email'] = self.normalize_email(email)
        
        user = self.model(student_id=student_id, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, student_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(student_id, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """Custom user model with RBAC"""
    
    ROLE_CHOICES = [
        ('STUDENT', 'Student'),
        ('FACILITATOR', 'Facilitator'),
        ('ORGANIZER', 'Event Organizer'),
        ('HOUSE_LEADER', 'House Leader'),
        ('ADMIN', 'Administrator'),
    ]
    
    # Authentication
    email = models.EmailField(unique=True, db_index=True)
    password = models.CharField(max_length=255)  # Django handles hashing
    
    # Personal Info
    student_id = models.CharField(max_length=20, unique=True, db_index=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    
    # Academic Info
    program = models.CharField(max_length=50)  # CS, IT, Engineering
    year_level = models.IntegerField()
    
    # Role & House
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT', db_index=True)
    house = models.ForeignKey(House, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    
    # Contact Info
    phone_number = models.CharField(max_length=20, blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    contact_number = models.CharField(max_length=20, blank=True)
    
    # Profile
    profile_photo = models.URLField(max_length=500, blank=True)  # Cloudinary URL
    bio = models.TextField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    
    # Password Reset
    reset_password_token = models.CharField(max_length=255, blank=True)
    reset_password_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'student_id'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['student_id']),
            models.Index(fields=['role']),
            models.Index(fields=['house']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.student_id} - {self.get_full_name()}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_student(self):
        return self.role == 'STUDENT'
    
    @property
    def is_facilitator(self):
        return self.role in ['FACILITATOR', 'ORGANIZER', 'ADMIN']
    
    @property
    def is_organizer(self):
        return self.role in ['ORGANIZER', 'ADMIN']


class QRCode(BaseModel):
    """Unique QR code for each student"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='qr_code')
    code_data = models.TextField()  # Base64 encoded payload
    signature = models.CharField(max_length=100, db_index=True)  # HMAC-SHA256
    version = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)
    last_regenerated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'qr_codes'
    
    def __str__(self):
        return f"QR Code - {self.user.student_id}"