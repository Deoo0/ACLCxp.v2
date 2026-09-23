"""Season export and purge use unscoped managers intentionally."""
import csv
import hashlib
import io
import json
import zipfile
from django.core.serializers.json import DjangoJSONEncoder
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Sum, Q
from apps.events.models import Event, EventRegistration
from apps.results.models import MatchAnnouncement, EventResult, PointsTransaction
from apps.attendance.models import Attendance, ScanLog
from apps.users.models import IntramuralsTicket, User
from apps.analytics.models import AuditLog, SystemSetting
from apps.houses.models import House, HouseStanding
from apps.notifications.models import Notification, EmailLog
from .models import SeasonMembership


def season_records(season):
    return {
        "events": Event.all_objects.filter(season=season),
        "registrations": EventRegistration.all_objects.filter(event__season=season),
        "matches": MatchAnnouncement.all_objects.filter(event__season=season),
        "results": EventResult.all_objects.filter(event__season=season),
        "points": PointsTransaction.all_objects.filter(season=season),
        "attendance": Attendance.all_objects.filter(event__season=season),
        "scan_logs": ScanLog.all_objects.filter(season=season),
        "tickets": IntramuralsTicket.all_objects.filter(season=season),
        "memberships": SeasonMembership.objects.filter(season=season),
        "audit_logs": AuditLog.all_objects.filter(season=season),
        "house_standings": HouseStanding.all_objects.filter(season=season),
        "notifications": Notification.all_objects.filter(season=season),
        "email_logs": EmailLog.all_objects.filter(season=season),
    }


def archive(season):
    records = season_records(season)
    participant_ids = set(records["memberships"].values_list("user_id", flat=True))
    for name in ("attendance", "registrations", "results", "points"):
        participant_ids.update(records[name].exclude(user_id=None).values_list("user_id", flat=True))
    records.update(students=User.objects.filter(pk__in=participant_ids), houses=House.objects.all(), settings=SystemSetting.objects.all())
    from apps.events.models import EventCategory
    records["categories"] = EventCategory.objects.all()
    excluded = {"password", "reset_password_token", "reset_password_expires_at", "qr_token", "qr_code_data", "qr_code_used", "provider_response"}
    payload = {name: [{key: value for key, value in row.items() if key not in excluded} for row in qs.order_by("pk").values()] for name, qs in records.items()}
    # Snapshot this season's totals even when a newer season is already current.
    totals = dict(records["points"].filter(is_approved=True, is_reversed=False).values("house_id").annotate(total=Sum("points")).values_list("house_id", "total"))
    for house in payload["houses"]:
        house["total_points"] = totals.get(house["id"], 0)
        house["member_count"] = records["memberships"].filter(user__house_id=house["id"]).count()
    payload["season"] = {"id": season.pk, "name": season.name, "status": season.status, "starts_on": season.starts_on, "ends_on": season.ends_on, "closed_at": season.closed_at}
    media, missing = {}, []
    paths = set()
    for event in records["events"]:
        for photo in (event.banner_image, event.poster_image):
            if photo and not photo.name.startswith(("http://", "https://")):
                paths.add(photo.name)
    for path in sorted(paths):
        try:
            with default_storage.open(path, "rb") as photo:
                media[path] = photo.read()
        except FileNotFoundError:
            missing.append(path)
    payload["media_checksums"] = {path: hashlib.sha256(data).hexdigest() for path, data in media.items()}
    payload["missing_media"] = missing
    body = json.dumps(payload, cls=DjangoJSONEncoder, sort_keys=True).encode()
    digest = hashlib.sha256(body).hexdigest()
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as bundle:
        bundle.writestr("records.json", body)
        bundle.writestr("manifest.json", json.dumps({"format_version": 1, "season": season.name, "sha256": digest, "counts": {key: len(payload[key]) for key in records}, "missing_media": missing, "note": "Accounts, houses and settings are reference snapshots. Passwords and authentication tokens are excluded. No automatic restore tool is included."}))
        for name in records:
            rows = payload[name]
            stream = io.StringIO()
            if rows:
                writer = csv.writer(stream)
                writer.writerow(rows[0].keys())
                for row in rows:
                    cells = []
                    for value in row.values():
                        cell = json.dumps(value, cls=DjangoJSONEncoder) if isinstance(value, (dict, list)) else str(value if value is not None else "")
                        cells.append("'" + cell if cell.lstrip().startswith(("=", "+", "-", "@")) else cell)
                    writer.writerow(cells)
            bundle.writestr(f"reports/{name}.csv", "\ufeff" + stream.getvalue())
        for path, data in media.items():
            bundle.writestr("media/" + path, data)
    return output.getvalue(), digest, missing


def purge_records(season):
    records = season_records(season)
    image_paths = set()
    for event in records["events"]:
        for image in (event.banner_image, event.poster_image):
            if image and image.name.startswith("events/") and ".." not in image.name.split("/"):
                # Never remove an image also referenced by another season.
                if not Event.all_objects.exclude(season=season).filter(Q(banner_image=image.name) | Q(poster_image=image.name)).exists():
                    image_paths.add(image.name)
    # Detach bracket edges before deleting the closed season's graph.
    records["matches"].update(source_one=None, source_two=None)
    for key in ("notifications", "email_logs", "scan_logs", "audit_logs", "points", "memberships", "tickets", "house_standings", "matches", "results", "attendance", "registrations", "events"):
        records[key].delete()

    def remove_media():
        import logging
        for name in image_paths:
            try:
                default_storage.delete(name)
            except OSError:
                logging.getLogger(__name__).exception("Season media cleanup failed for %s", name)
    transaction.on_commit(remove_media)
