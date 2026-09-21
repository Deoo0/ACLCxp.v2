"""Adjust these character limits; the admin editor reads them from the API."""
from django.db import models
from rest_framework import serializers

DEFAULT_TEXT_LIMIT = 2000
TEXT_LIMITS = {
    "events.Event.description": 3000,
    "events.Event.requirements": 1500,
    "events.Event.rules": 3000,
    "events.Event.prizes": 1000,
    "events.EventCategory.description": 500,
    "houses.House.description": 1000,
    "users.User.bio": 500,
}


class LimitedModelSerializer(serializers.ModelSerializer):
    def build_standard_field(self, field_name, model_field):
        field_class, kwargs = super().build_standard_field(field_name, model_field)
        if isinstance(model_field, models.TextField):
            key = f"{model_field.model._meta.label}.{field_name}"
            kwargs["max_length"] = TEXT_LIMITS.get(key, DEFAULT_TEXT_LIMIT)
        return field_class, kwargs
