from apps.seasons.scope import SeasonManager, current_season_id
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db import models
from apps.core.models import BaseModel
from apps.houses.models import House


class UserManager(BaseUserManager):
    """Custom user manager"""

    def create_user(self, student_id, password=None, **extra_fields):
        if not student_id:
            raise ValueError("Student ID is required")

        email = extra_fields.get("email")
        if email:
            extra_fields["email"] = self.normalize_email(email)

        user = self.model(student_id=student_id, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, student_id, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "ADMIN")
        return self.create_user(student_id, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """Custom user model with RBAC"""

    ROLE_CHOICES = [
        ("STUDENT", "Student"),
        ("STAFF", "Staff"),
        ("ORGANIZER", "Event Organizer"),
        ("ADMIN", "Administrator"),
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
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default="STUDENT", db_index=True
    )
    house = models.ForeignKey(
        House,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
        db_index=True,
    )

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

    USERNAME_FIELD = "student_id"
    REQUIRED_FIELDS = ["email", "first_name", "last_name","year_level"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["student_id"]),
            models.Index(fields=["role"]),
            models.Index(fields=["house"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.student_id} - {self.get_full_name()}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def is_student(self):
        return self.role == "STUDENT"

    @property
    def is_facilitator(self):
        return self.role in ["FACILITATOR", "ORGANIZER", "ADMIN"]

    @property
    def is_organizer(self):
        return self.role in ["ORGANIZER", "ADMIN"]


class StudentRoster(BaseModel):
    """School-controlled student records. These records, not signup input, define students."""

    student_number = models.CharField(max_length=20, unique=True, db_index=True)
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50)
    program = models.CharField(max_length=50)
    year_level = models.PositiveSmallIntegerField()
    section = models.CharField(max_length=50, blank=True)
    is_eligible = models.BooleanField(default=True, db_index=True)
    account = models.OneToOneField(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="roster_record"
    )

    class Meta:
        db_table = "student_roster"
        ordering = ["student_number"]

    def __str__(self):
        return f"{self.student_number} - {self.first_name} {self.last_name}"


class IntramuralsTicket(BaseModel):

    objects = SeasonManager()
    all_objects = models.Manager()
    season = models.ForeignKey("seasons.Season", on_delete=models.PROTECT, null=True, blank=True, default=current_season_id)
    """An opaque, school-issued ticket that may activate exactly one roster record."""

    AVAILABLE = "AVAILABLE"
    REDEEMED = "REDEEMED"
    DISABLED = "DISABLED"
    STATUS_CHOICES = [(AVAILABLE, "Available"), (REDEEMED, "Redeemed"), (DISABLED, "Disabled")]

    ticket_number = models.CharField(max_length=12, unique=True, db_index=True)
    qr_token = models.CharField(max_length=255, unique=True, db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=AVAILABLE, db_index=True)
    issued_at = models.DateTimeField(null=True, blank=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    redeemed_by = models.ForeignKey(
        StudentRoster, null=True, blank=True, on_delete=models.PROTECT, related_name="redeemed_tickets"
    )

    class Meta:
        db_table = "intramurals_tickets"
        indexes = [models.Index(fields=["status", "ticket_number"])]

    def __str__(self):
        return f"{self.ticket_number} ({self.status})"


class QRCode(BaseModel):
    """Unique QR code for each student"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="qr_code")
    code_data = models.TextField()  # Base64 encoded payload
    signature = models.CharField(max_length=100, db_index=True)  # HMAC-SHA256
    version = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)
    last_regenerated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "qr_codes"

    def __str__(self):
        return f"QR Code - {self.user.student_id}"
