"""Temporary real PostgreSQL + Django server for browser integration checks.

Creates a uniquely named test database, never writes to the configured database.
Prints a temporary manifest path; create its .stop sibling to stop and clean up.
The server also stops after 20 minutes. Credentials never enter source control.
"""
import json
import os
from pathlib import Path
import secrets
import sys
import tempfile
import time
from datetime import timedelta
from uuid import uuid4
from wsgiref.simple_server import WSGIServer, WSGIRequestHandler, make_server

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django
django.setup()
from django.conf import settings
from django.db import connection, connections
from django.core.wsgi import get_wsgi_application
from django.utils import timezone

assert connection.vendor == "postgresql", "This check requires PostgreSQL."
original_name = connection.settings_dict["NAME"]
test_name = "mobile_qa_" + uuid4().hex[:16]
connection.settings_dict["TEST"]["NAME"] = test_name
manifest = Path(tempfile.gettempdir()) / (test_name + ".json")
stop = manifest.with_suffix(".stop")
created = False
try:
    connection.creation.create_test_db(verbosity=0, autoclobber=False)
    created = True
    assert connection.settings_dict["NAME"] == test_name
    settings.CORS_ALLOWED_ORIGINS = ["http://127.0.0.1:5174", "http://localhost:5174"]
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    from apps.users.models import User, StudentRoster, IntramuralsTicket
    from apps.houses.models import House
    from apps.seasons.models import Season, SeasonMembership
    from apps.events.models import Event, EventCategory

    password = secrets.token_urlsafe(24)
    house = House.objects.create(name="Mobile QA House", color_code="#2563eb")
    season = Season.objects.create(name="Mobile QA Season", status="ACTIVE", is_current=True)
    users = {}
    for role in ("STUDENT", "ADMIN"):
        users[role] = User.objects.create_user(
            "QA-" + role, password, role=role, email=f"qa-{role.lower()}@example.com",
            first_name="Mobile", last_name=role.title(), program="BSIT", year_level=1,
            house=house, is_staff=role == "ADMIN")
    student = users["STUDENT"]
    roster = StudentRoster.objects.create(student_number=student.student_id,
        first_name=student.first_name, last_name=student.last_name, program="BSIT",
        year_level=1, account=student)
    ticket = IntramuralsTicket.objects.create(ticket_number="999888777666", qr_token=secrets.token_urlsafe(24),
        season=season, status="REDEEMED", redeemed_by=roster)
    SeasonMembership.objects.create(season=season, user=student, ticket=ticket)
    category = EventCategory.objects.create(name="Mobile QA Sports", slug="mobile-qa-sports")
    event = Event.objects.create(title="Mobile QA Campus Chess", slug="mobile-qa-chess",
        description="A real API test event for checking registration and mobile layouts.",
        category=category, organizer=users["ADMIN"], season=season,
        event_date=timezone.localdate() + timedelta(days=3), start_time="10:00", end_time="12:00",
        venue="Campus activity hall", capacity=10, status="PUBLISHED", registration_required=True)

    class QuietHandler(WSGIRequestHandler):
        def log_message(self, format, *args):
            pass

    with make_server("127.0.0.1", 8001, get_wsgi_application(), server_class=WSGIServer,
                     handler_class=QuietHandler) as server:
        server.timeout = 0.5
        manifest.write_text(json.dumps({"password": password, "student": student.student_id,
            "admin": users["ADMIN"].student_id, "eventId": event.pk,
            "api": "http://127.0.0.1:8001", "database": test_name}), encoding="utf-8")
        print(f"READY manifest={manifest}", flush=True)
        deadline = time.monotonic() + 1200
        while time.monotonic() < deadline and not stop.exists():
            server.handle_request()
finally:
    connections.close_all()
    if created:
        connection.creation.destroy_test_db(original_name, verbosity=0)
        print(f"CLEANED database={test_name}", flush=True)
    manifest.unlink(missing_ok=True)
    stop.unlink(missing_ok=True)
