from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    RegisterSerializer,
    UpdateUserSerializer,
    UserProfileSerializer,
)
from .models import User
from django.shortcuts import get_object_or_404


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Simple endpoint to test connectivity"""
    return Response(
        {
            "status": "success",
            "message": "Backend is running!",
        }
    )


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def echo_test(request):
    """Echo back what frontend sends"""
    if request.method == "GET":
        return Response(
            {"method": "GET", "message": "Send me a POST request with data!"}
        )
    return Response(
        {
            "method": "POST",
            "received_data": request.data,
            "message": "I received your data successfully!",
        }
    )


@api_view(["GET"])
def list_user(request):
    users = User.objects.values(
        "id",
        "student_id",
        "first_name",
        "last_name",
        "middle_name",
        "program",
        "year_level",
        "house_id",
        "role",
    )

    return Response(
        {"status": "success", "data": list(users)}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    # This legacy endpoint formerly accepted arbitrary identity fields. Keeping it
    # non-functional prevents callers from bypassing ticket and roster verification.
    return Response(
        {"status": "error", "message": "Use the ticket-verified registration flow.", "code": "TICKET_VERIFICATION_REQUIRED"},
        status=status.HTTP_410_GONE,
    )


@api_view(["PATCH"])
def update_user(request, user_id):
    user = get_object_or_404(User, id=user_id)

    serializer = UpdateUserSerializer(user, data=request.data, partial=True)

    if not serializer.is_valid():
        return Response(
            {
                "status": "error",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer.save()

    return Response(
        {
            "status": "success",
            "message": "User updated successfully",
            "data": UserProfileSerializer(user).data,
        },
        status=status.HTTP_200_OK,
    )
