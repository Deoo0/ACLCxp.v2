from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from apps.users.models import User
from apps.users.serializers import UserProfileSerializer


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
        token = RefreshToken(refresh)
        return Response(
            {
                "status": "success",
                "message": "Token refreshed successfully",
                "data": {
                    "access": str(token.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )
    except TokenError:
        return Response(
            {"status": "error", "message": "Invalid or expired token"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserProfileSerializer(request.user)
    return Response({"status": "success", "data": {"user": serializer.data}})
