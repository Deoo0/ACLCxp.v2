"""Isolated unit/API tests. Never connect to the configured application database."""
from .base import *

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CORS_ALLOWED_ORIGINS = []
ALLOWED_HOSTS = ["testserver", "localhost"]
REST_FRAMEWORK = {**REST_FRAMEWORK, "DEFAULT_THROTTLE_CLASSES": [],
                  "DEFAULT_THROTTLE_RATES": {**REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"],
                                              "ticket_verification": "10000/minute",
                                              "student_verification": "10000/minute",
                                              "account_activation": "10000/hour"}}
