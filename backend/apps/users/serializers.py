from apps.core.text_limits import LimitedModelSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.houses.models import House
from django.db import models

User = get_user_model()


class RegisterSerializer(LimitedModelSerializer):
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


class UserProfileSerializer(LimitedModelSerializer):
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
            "phone_number", "contact_person", "contact_number", "bio",
            "email_verified",
        ]
        read_only_fields = fields  # This serializer is for reading only

    def get_full_name(self, obj):
        return obj.get_full_name()


class UpdateUserSerializer(LimitedModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    def validate(self, attrs):
        from apps.core.permissions import is_admin
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        request = self.context.get("request")
        editable = {"phone_number", "contact_person", "contact_number", "bio", "profile_photo"}
        if not request or not is_admin(request.user):
            forbidden = set(self.initial_data) - editable
            if forbidden:
                raise serializers.ValidationError({key: "Only an administrator may change this field." for key in forbidden})
        elif self.instance:
            if self.instance.is_superuser and not request.user.is_superuser:
                raise serializers.ValidationError("Only a superuser may edit a superuser account.")
            if self.instance.pk == request.user.pk and (attrs.get("is_active") is False or attrs.get("role", self.instance.role) != self.instance.role):
                raise serializers.ValidationError("You cannot disable or demote your own account.")
        if "password" in attrs:
            try:
                validate_password(attrs["password"], self.instance)
            except ValidationError as exc:
                raise serializers.ValidationError({"password": exc.messages})
        return attrs

    house_id = serializers.IntegerField(required=False, allow_null=True)

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
        if value is None:
            return None
        try:
            house = House.objects.get(id=value, is_active=True)
        except House.DoesNotExist:
            raise serializers.ValidationError("Invalid house selected.")

        return house

    def update(self, instance, validated_data):
        new_house = validated_data.pop("house_id", instance.house)

        # Handle house change
        if instance.house != new_house:
            from django.db.models.functions import Greatest
            list(House.objects.select_for_update().filter(pk__in=[pk for pk in (instance.house_id, new_house.pk if new_house else None) if pk]).order_by("pk"))

            # decrement old house
            if instance.house:
                House.objects.filter(id=instance.house.id).update(
                    member_count=Greatest(models.F("member_count") - 1, 0)
                )

            # increment new house
            if new_house:
                House.objects.filter(id=new_house.id).update(
                    member_count=models.F("member_count") + 1
                )

            instance.house = new_house

        password = validated_data.pop("password", None)
        if password is not None:
            instance.set_password(password)
        if "email" in validated_data and validated_data["email"] != instance.email:
            instance.email_verified = False
            instance.email_verified_at = None

        # Update remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        return instance
