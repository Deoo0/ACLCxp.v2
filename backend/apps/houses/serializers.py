from rest_framework import serializers
from .models import House

class HouseSerializer(serializers.ModelSerializer):
    """Full house details — used for admin views"""
    
    class Meta:
        model = House
        fields = [
            'id', 'name', 'description', 'color_code',
            'motto', 'logo_url', 'total_points',
            'current_rank', 'member_count', 'is_active'
        ]


class HouseSelectSerializer(serializers.ModelSerializer):
    """Minimal house info — used in registration dropdown"""
    
    class Meta:
        model = House
        fields = ['id', 'name', 'color_code', 'motto']