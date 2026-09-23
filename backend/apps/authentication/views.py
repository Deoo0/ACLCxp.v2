from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.decorators import throttle_classes
from rest_framework.throttling import SimpleRateThrottle
from apps.users.models import IntramuralsTicket, StudentRoster, User
from apps.users.serializers import UserProfileSerializer


class _RegistrationThrottle(SimpleRateThrottle):
    """IP-based throttling for public registration endpoints."""
    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class TicketVerificationThrottle(_RegistrationThrottle):
    scope = "ticket_verification"


class StudentVerificationThrottle(_RegistrationThrottle):
    scope = "student_verification"


class AccountActivationThrottle(_RegistrationThrottle):
    scope = "account_activation"


def _error(code, message, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"status": "error", "code": code, "message": message}, status=http_status)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([TicketVerificationThrottle])
def verify_ticket(request):
    """Validate a ticket server-side and return a short-lived, signed verification receipt."""
    manual_number = request.data.get("ticket_number")
    qr_token = request.data.get("qr_token")
    if bool(manual_number) == bool(qr_token):
        return _error("INVALID_TICKET", "This ticket could not be verified. Please check your ticket and try again.")
    if manual_number:
        manual_number = str(manual_number).strip()
        if not manual_number.isdigit() or len(manual_number) not in (6, 12):
            return _error("INVALID_TICKET", "This ticket could not be verified. Please check your ticket and try again.")
        ticket = IntramuralsTicket.objects.filter(ticket_number=manual_number).first()
    else:
        ticket = IntramuralsTicket.objects.filter(qr_token=str(qr_token).strip()).first()
    if not ticket or ticket.status == IntramuralsTicket.DISABLED:
        return _error("INVALID_TICKET", "This ticket could not be verified. Please check your ticket and try again.")
    if ticket.status == IntramuralsTicket.REDEEMED or ticket.redeemed_by_id:
        return _error("TICKET_USED", "This ticket has already been used to activate a student account.", status.HTTP_409_CONFLICT)
    receipt = signing.dumps({"ticket_id": ticket.pk}, salt="intramurals-ticket-verification", compress=True)
    return Response({"status": "success", "data": {"verification_token": receipt}})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([StudentVerificationThrottle])
def verify_student(request):
    """Check roster eligibility without exposing the roster's personal data."""
    student_number = str(request.data.get("student_number") or "").strip().upper()
    ticket_receipt = request.data.get("ticket_verification_token")
    if not student_number or not ticket_receipt:
        return _error("INVALID_REQUEST", "Ticket verification and Student Number are required.")
    try:
        receipt = signing.loads(ticket_receipt, salt="intramurals-ticket-verification", max_age=600)
    except signing.BadSignature:
        return _error("TICKET_VERIFICATION_EXPIRED", "Please verify your ticket again.")
    ticket = IntramuralsTicket.objects.filter(pk=receipt.get("ticket_id")).first()
    if not ticket or ticket.status != IntramuralsTicket.AVAILABLE or ticket.redeemed_by_id:
        return _error("TICKET_USED", "This ticket is no longer available for account activation.", status.HTTP_409_CONFLICT)
    roster = StudentRoster.objects.filter(student_number=student_number).first()
    if not roster or not roster.is_eligible:
        return _error("STUDENT_NOT_FOUND", "We couldn't verify this Student Number. Please check the number and try again.", status.HTTP_404_NOT_FOUND)
    if roster.account_id or User.objects.filter(student_id=student_number).exists():
        return _error("ACCOUNT_ACTIVATED", "An account has already been activated for this Student Number. Please proceed to login.", status.HTTP_409_CONFLICT)
    student_receipt = signing.dumps({"ticket_id": ticket.pk, "student_id": roster.pk}, salt="intramurals-student-verification", compress=True)
    return Response({"status": "success", "data": {"activation_token": student_receipt}})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AccountActivationThrottle])
def activate_account(request):
    """Atomically create the account and redeem its ticket. Never trust earlier client checks."""
    activation_token = request.data.get("activation_token")
    email = str(request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not activation_token or not email or not password:
        return _error("INVALID_REQUEST", "Activation token, email, and password are required.")
    if not email.endswith("@gmail.com"):
        return _error("INVALID_EMAIL", "Only @gmail.com email addresses are allowed.")
    try:
        receipt = signing.loads(activation_token, salt="intramurals-student-verification", max_age=600)
    except signing.BadSignature:
        return _error("ACTIVATION_EXPIRED", "Your verification has expired. Please start again.")
    try:
        validate_password(password)
    except ValidationError as exc:
        return _error("INVALID_PASSWORD", " ".join(exc.messages))
    try:
        with transaction.atomic():
            # Locks make concurrent redemption attempts serialize on databases that support row locking.
            ticket = IntramuralsTicket.objects.select_for_update().get(pk=receipt["ticket_id"])
            roster = StudentRoster.objects.select_for_update().get(pk=receipt["student_id"])
            if ticket.status != IntramuralsTicket.AVAILABLE or ticket.redeemed_by_id:
                return _error("TICKET_USED", "This ticket has already been used to activate a student account.", status.HTTP_409_CONFLICT)
            if not roster.is_eligible:
                return _error("STUDENT_NOT_FOUND", "We couldn't verify this Student Number. Please check the number and try again.", status.HTTP_404_NOT_FOUND)
            if roster.account_id or User.objects.filter(student_id=roster.student_number).exists():
                return _error("ACCOUNT_ACTIVATED", "An account has already been activated for this Student Number. Please proceed to login.", status.HTTP_409_CONFLICT)
            if User.objects.filter(email=email).exists():
                return _error("EMAIL_IN_USE", "This email is already registered. Please log in instead.", status.HTTP_409_CONFLICT)
            user = User.objects.create_user(
                student_id=roster.student_number, email=email, password=password,
                first_name=roster.first_name, middle_name=roster.middle_name,
                last_name=roster.last_name, program=roster.program, year_level=roster.year_level,
                role="STUDENT",
            )
            roster.account = user
            roster.save(update_fields=["account", "updated_at"])
            ticket.status = IntramuralsTicket.REDEEMED
            ticket.redeemed_by = roster
            ticket.redeemed_at = timezone.now()
            ticket.save(update_fields=["status", "redeemed_by", "redeemed_at", "updated_at"])
            if ticket.season_id:
                from apps.seasons.models import SeasonMembership
                SeasonMembership.objects.create(season_id=ticket.season_id, user=user, ticket=ticket)
    except (IntramuralsTicket.DoesNotExist, StudentRoster.DoesNotExist, KeyError):
        return _error("ACTIVATION_INVALID", "Your verification is invalid. Please start again.")
    except IntegrityError:
        # Covers unique constraints even on database engines without effective select_for_update.
        return _error("ACTIVATION_CONFLICT", "This ticket or Student Number was just activated. Please log in or try another ticket.", status.HTTP_409_CONFLICT)
    return Response({"status": "success", "message": "Account activated successfully.", "data": {"student_id": user.student_id}}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """
    Login with Student USN and password
    Expected payload: {
        "student_id": "string",
        "password": "string"
    }
    """
    student_id = request.data.get("student_id")
    password = request.data.get("password")

    if not student_id or not password:
        return Response(
            {"status": "error", "message": "Student ID and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(student_id=student_id)
    except User.DoesNotExist:
        return Response(
            {
                "status": "error",
                "message": "No account found with that Student ID. Please register first.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if not user.is_active:
        return Response(
            {
                "status": "error",
                "message": "Your account has been disabled. Please contact the administrator.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    authenticated_user = authenticate(request, username=student_id, password=password)
    if authenticated_user is None:
        return Response(
            {
                "status": "error",
                "message": "Invalid Student ID or password.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )
        
    refresh = RefreshToken.for_user(authenticated_user)

    return Response(
        {
            "status": "success",
            "message": "Login successful",
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": authenticated_user.id,
                    "email": authenticated_user.email,
                    "student_id": authenticated_user.student_id,
                    "first_name": authenticated_user.first_name,
                    "last_name": authenticated_user.last_name,
                    "role": authenticated_user.role,
                },
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout by blacklisting the refresh token
    Expected payload: {
        "refresh": "string"
    }
    """
    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response(
            {"status": "error", "message": "Refresh token is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        token = RefreshToken(refresh_token)
        if str(token.get("user_id")) != str(request.user.pk):
            return Response({"detail": "This token belongs to another account."}, status=403)
        token.blacklist()
        return Response(
            {"status": "success", "message": "Logged out successfully"},
            status=status.HTTP_200_OK,
        )
    except TokenError:
        return Response(
            {"status": "error", "message": "Invalid or expired token"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Get new access token using refresh token
    Expected payload: {
        "refresh": "string"
    }
    """
    refresh = request.data.get("refresh")

    if not refresh:
        return Response(
            {"status": "error", "message": "Refresh token is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        from rest_framework_simplejwt.serializers import TokenRefreshSerializer
        from rest_framework_simplejwt.settings import api_settings
        from rest_framework_simplejwt.utils import get_md5_hash_password
        token = RefreshToken(refresh)
        user = User.objects.filter(pk=token.get("user_id"), is_active=True).first()
        if not user or (api_settings.CHECK_REVOKE_TOKEN and token.get(api_settings.REVOKE_TOKEN_CLAIM) != get_md5_hash_password(user.password)):
            return Response({"detail": "Session expired. Please sign in again."}, status=401)
        serializer = TokenRefreshSerializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        return Response({"status": "success", "data": serializer.validated_data})
    except TokenError:
        return Response({"status": "error", "message": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserProfileSerializer(request.user)
    return Response({"status": "success", "data": {"user": serializer.data}})
