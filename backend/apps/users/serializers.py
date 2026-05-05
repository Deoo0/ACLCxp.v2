from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.houses.models import House

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    house_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'student_id',
            'first_name', 'last_name', 'middle_name',
            'program', 'year_level',
            'password', 'house_id',
        ]

    def validate_email(self, value):
        if not value.lower().endswith('@gmail.com'):
            raise serializers.ValidationError(
                "Only @gmail.com email addresses are allowed."
            )
        return value.lower()

    def validate_student_id(self, value):
        if User.objects.filter(student_id=value).exists():
            raise serializers.ValidationError("This Student ID is already registered.")
        return value

    def validate_house_id(self, value):
        try:
            house = House.objects.get(id=value, is_active=True)
        except House.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid house selected. Please choose a valid house."
            )
        return house  # Return the House object, not just the UUID

    def create(self, validated_data):
        house = validated_data.pop('house_id')  # Already a House object from validate_house_id
        password = validated_data.pop('password')

        # create_user from your UserManager handles password hashing
        user = User.objects.create_user(
            password=password,
            house=house,
            **validated_data
        )

        # Keep member_count in sync on the House
        House.objects.filter(id=house.id).update(
            member_count=models.F('member_count') + 1
        )

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only profile — returned after login or /api/auth/me/"""
    
    house_name = serializers.CharField(source='house.name', read_only=True)
    house_color = serializers.CharField(source='house.color_code', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'student_id',
            'first_name', 'last_name', 'full_name',
            'program', 'year_level', 'role',
            'house', 'house_name', 'house_color',
            'profile_photo', 'email_verified',
        ]
        read_only_fields = fields  # This serializer is for reading only

    def get_full_name(self, obj):
        return obj.get_full_name()