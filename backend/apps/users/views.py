from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from .models import User


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple endpoint to test connectivity"""
    return Response({
        "status": "success",
        "message": "Backend is running!",
    })


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def echo_test(request):
    """Echo back what frontend sends"""
    if request.method == 'GET':
        return Response({
            "method": "GET",
            "message": "Send me a POST request with data!"
        })
    return Response({
        "method": "POST",
        "received_data": request.data,
        "message": "I received your data successfully!"
    })

@api_view(['GET'])
def list_user(request):
    users = User.objects.values('id','student_id','first_name','last_name','program','year_level','house_id','role')
    
    return Response({
        'status': 'success',
        'data': list(users)
    },status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({
            'status': 'error',
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()

    return Response({
        'status': 'success',
        'message': 'User registered successfully',
        'data': {
            'id': str(user.id),
            'student_id': user.student_id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'house': {
                'id': str(user.house.id),
                'name': user.house.name,
                'color_code': user.house.color_code,
            } if user.house else None,
        }
    }, status=status.HTTP_201_CREATED)