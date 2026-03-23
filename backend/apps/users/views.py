from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse

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
# Create your views here.
