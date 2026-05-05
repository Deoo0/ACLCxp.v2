from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import House

@api_view(['GET'])
def list_houses(request):
    """
    Public endpoint — anyone can see the list of houses.
    Used during registration so students can pick their assigned house.
    """
    houses = House.objects.filter(is_active=True).values(
        'id', 'name', 'description', 'color_code', 'motto',
        'total_points', 'current_rank', 'member_count'
    )
    return Response({
        'status': 'success',
        'data': list(houses)
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
#@permission_classes([IsAdminUser])  # Only admins can create houses
def add_house(request):
    """
    Admin only: Create a new house.
    The 5 houses are usually seeded once via fixtures,
    but this endpoint lets admins add one if needed.
    """
    data = request.data

    # Validate required fields
    required_fields = ['name', 'color_code']
    for field in required_fields:
        if not data.get(field):
            return Response({
                'status': 'error',
                'message': f'{field} is required'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Prevent duplicates
    if House.objects.filter(name=data['name']).exists():
        return Response({
            'status': 'error',
            'message': f"House '{data['name']}' already exists"
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        house = House.objects.create(
            name=data['name'],
            description=data.get('description', ''),
            color_code=data['color_code'],
            motto=data.get('motto', ''),
            logo_url=data.get('logo_url', ''),
            is_active=data.get('is_active', True),
        )
        return Response({
            'status': 'success',
            'message': f"House '{house.name}' created successfully",
            'data': {
                'id': str(house.id),
                'name': house.name,
                'color_code': house.color_code,
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)