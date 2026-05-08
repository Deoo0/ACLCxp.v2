from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login with Student USN and password
    Expected payload: {
        "student_id": "string",
        "password": "string"
    }
    """ 
    student_id = request.data.get('student_id')
    password = request.data.get('password')

    if not student_id or not password:
        return Response({
            'status': 'error',
            'message': 'Student ID and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=student_id, password=password)

    if user is None:
        return Response({
            'status': 'error',
            'message': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({
            'status': 'error',
            'message': 'Account is disabled'
        }, status=status.HTTP_403_FORBIDDEN)

    refresh = RefreshToken.for_user(user)

    return Response({
        'status': 'success',
        'message': 'Login successful',
        'data': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'student_id': user.student_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
            }
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout by blacklisting the refresh token
    Expected payload: {
        "refresh": "string"
    }
    """
    refresh_token = request.data.get('refresh')

    if not refresh_token:
        return Response({
            'status': 'error',
            'message': 'Refresh token is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({
            'status': 'success',
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
    except TokenError:
        return Response({
            'status': 'error',
            'message': 'Invalid or expired token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Get new access token using refresh token
    Expected payload: {
        "refresh": "string"
    }
    """
    refresh = request.data.get('refresh')

    if not refresh:
        return Response({
            'status': 'error',
            'message': 'Refresh token is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = RefreshToken(refresh)
        return Response({
            'status': 'success',
            'message': 'Token refreshed successfully',
            'data': {
                'access': str(token.access_token),
            }
        }, status=status.HTTP_200_OK)
    except TokenError:
        return Response({
            'status': 'error',
            'message': 'Invalid or expired token'
        }, status=status.HTTP_400_BAD_REQUEST)