"""Persistent, revocable student credentials; identity is verified by staff."""
import secrets
from django.core import signing
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.users.models import QRCode, User

SALT = "student-download-pass-v1"

def issue_pass(user):
    row, _ = QRCode.objects.get_or_create(user=user, defaults={"code_data": secrets.token_urlsafe(32), "signature": "", "version": 1})
    if not row.is_active or (row.expires_at and row.expires_at <= timezone.now()):
        raise ValidationError("Your pass is disabled. Contact an administrator.")
    return signing.dumps({"account": user.pk, "nonce": row.code_data, "version": row.version}, salt=SALT)

def resolve_student(token=None, student_id=None):
    if token:
        try:
            payload = signing.loads(token, salt=SALT)
        except signing.BadSignature:
            try:
                payload = signing.loads(token, salt="student-event-pass", max_age=300)
                student_id = payload["student_id"]
            except (signing.BadSignature, KeyError, TypeError):
                raise ValidationError("Invalid or expired QR pass.")
        else:
            if not isinstance(payload, dict) or type(payload.get("account")) is not int or not isinstance(payload.get("nonce"), str):
                raise ValidationError("Invalid QR pass.")
            row = QRCode.objects.select_related("user__house").filter(user_id=payload.get("account"), is_active=True).first()
            if not row or payload.get("nonce") != row.code_data or payload.get("version") != row.version or (row.expires_at and row.expires_at <= timezone.now()):
                raise ValidationError("Invalid or disabled QR pass.")
            user = row.user
            if not user.is_active or user.role != "STUDENT":
                raise ValidationError("Student account is unavailable.")
            return user
    return get_object_or_404(User.objects.select_related("house"), student_id=student_id, role="STUDENT", is_active=True)

def identity(user):
    return {"full_name": user.get_full_name(), "student_id": user.student_id, "house_name": user.house.name if user.house else "Unassigned"}

def confirmation(user):
    return signing.dumps({"account": user.pk}, salt="student-identity-confirmation")

def verify_confirmation(user, proof):
    try:
        if signing.loads(proof, salt="student-identity-confirmation", max_age=300)["account"] == user.pk:
            return
    except (signing.BadSignature, KeyError, TypeError):
        pass
    raise ValidationError("Preview the student's details and confirm their identity before recording attendance.")
