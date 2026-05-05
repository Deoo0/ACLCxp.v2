from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework import status
from .models import User
from apps.houses.models import House
from django.core.exceptions import ValidationError

@api_view(['GET'])
def health_check(request):
    """Simple endpoint to test connectivity"""
    return Response({
        "status": "success",
        "message": "Backend is running!",
        "timestamp": "2024-01-01 12:00:00"
    })

@api_view(['GET', 'POST'])
def echo_test(request):
    """Echo back what frontend sends"""
    if request.method == 'GET':
        return Response({
            "method": "GET",
            "message": "Send me a POST request with data!"
        })
    
    if request.method == 'POST':
        return Response({
            "method": "POST",
            "received_data": request.data,
            "message": "I received your data successfully!"
        })

@api_view(['POST'])
def register_user(request):
    """
    Register a new user
    Expected payload: {
        "email": "string",
        "student_id": "string", 
        "first_name": "string",
        "last_name": "string",
        "middle_name": "string (optional)",
        "password": "string",
        "program": "string",
        "year_level": "integer",
        "house": "string" ,
        "phone_number": "string (optional)",
        "contact_person": "string (optional)",
        "contact_number": "string (optional)"
    }
    """
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['email', 'student_id', 'first_name', 'last_name', 'password', 'program', 'year_level','house']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'status': 'error',
                    'message': f'{field} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=data['email']).exists():
            return Response({
                'status': 'error',
                'message': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(student_id=data['student_id']).exists():
            return Response({
                'status': 'error',
                'message': 'Student ID already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get house instance
        try:
            house = House.objects.get(name=data['house'])
        except House.DoesNotExist:
            return Response({
                'status': 'error',
                'message': f"House '{data['house']}' not found"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            email=data['email'],
            student_id=data['student_id'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            middle_name=data.get('middle_name', ''),
            program=data['program'],
            house=house,
            year_level=int(data['year_level']),
            phone_number=data.get('phone_number', ''),
            contact_person=data.get('contact_person', ''),
            contact_number=data.get('contact_number', ''),
        )
        
        return Response({
            'status': 'success',
            'message': 'User registered successfully',
            'data': {
                'id': user.id,
                'email': user.email,
                'house': {
                    'id': user.house.id,
                    'name': user.house.name,
                    'color_code': user.house.color_code,
                } if user.house else None,
                'student_id': user.student_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
