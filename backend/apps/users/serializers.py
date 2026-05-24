from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.houses.models import House
from django.db import models

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    house_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "student_id",
            "first_name",
            "last_name",
            "middle_name",
            "program",
            "year_level",
            "password",
            "house_id",
        ]

    def validate_email(self, value):
        if not value.lower().endswith("@gmail.com"):
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
        return house  # return house value instead of id

    def create(self, validated_data):
        house = validated_data.pop(
            "house_id"
        )  # Already a House object from validate_house_id
        password = validated_data.pop("password")

        # create_user from your UserManager handles password hashing
        user = User.objects.create_user(
            password=password, house=house, **validated_data
        )

        # Keep member_count in sync on the House
        House.objects.filter(id=house.id).update(
            member_count=models.F("member_count") + 1
        )

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only profile — returned after login or /api/auth/me/"""

    house_name = serializers.CharField(source="house.name", read_only=True)
    house_color = serializers.CharField(source="house.color_code", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "student_id",
            "first_name",
            "last_name",
            "full_name",
            "program",
            "year_level",
            "role",
            "house",
            "house_name",
            "house_color",
            "profile_photo",
            "email_verified",
        ]
        read_only_fields = fields  # This serializer is for reading only

    def get_full_name(self, obj):
        return obj.get_full_name()


class UpdateUserSerializer(serializers.ModelSerializer):
    house_id = serializers.IntegerField(required=False)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "middle_name",
            "password",
            "program",
            "year_level",
            "phone_number",
            "contact_person",
            "contact_number",
            "bio",
            "profile_photo",
            "house_id",
            "role",
        ]

    def validate_role(self, value):
        valid_roles = [choice[0] for choice in User.ROLE_CHOICES]

        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role. Valid roles are: {valid_roles}"
            )

        return value

    def validate_email(self, value):
        value = value.lower()

        if not value.endswith("@gmail.com"):
            raise serializers.ValidationError(
                "Only @gmail.com email addresses are allowed."
            )

        user = self.instance

        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This email is already in use.")

        return value

    def validate_house_id(self, value):
        try:
            house = House.objects.get(id=value, is_active=True)
        except House.DoesNotExist:
            raise serializers.ValidationError("Invalid house selected.")

        return house

    def update(self, instance, validated_data):
        new_house = validated_data.pop("house_id", None)

        # Handle house change
        if new_house and instance.house != new_house:

            # decrement old house
            if instance.house:
                House.objects.filter(id=instance.house.id).update(
                    member_count=models.F("member_count") - 1
                )

            # increment new house
            House.objects.filter(id=new_house.id).update(
                member_count=models.F("member_count") + 1
            )

            instance.house = new_house

        # Update remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        return instance
