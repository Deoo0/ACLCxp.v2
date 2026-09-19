"""Opt-in PostgreSQL tests: TEST_DATABASE_URL must point to a dedicated test server.

Django creates/destroys a separate test_<database> database. Never use production credentials.
"""
from .test import *

DATABASES = {"default": dj_database_url.parse(config("TEST_DATABASE_URL"), conn_max_age=0)}
if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":
    raise ValueError("TEST_DATABASE_URL must use PostgreSQL.")
