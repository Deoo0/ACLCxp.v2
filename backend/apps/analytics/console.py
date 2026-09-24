import csv
import io
import secrets
from django.core import signing
from django.db import IntegrityError, transaction
from django.db.models import Q, F, Count, Sum, OuterRef, Subquery, IntegerField, Value
from django.db.models.functions import Coalesce, Greatest
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, mixins, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.core.pagination import ApiPagination
from apps.core.permissions import IsSchoolAdmin
from apps.events.models import Event, EventRegistration
from apps.events.services import Conflict
from apps.events.filters import filter_event_period
from apps.users.models import User, StudentRoster, IntramuralsTicket
from apps.houses.models import House
from apps.attendance.models import Attendance, ScanLog
from apps.results.models import PointsTransaction, EventResult
from .models import AuditLog, SystemSetting
from .serializers import (AdminUserSerializer, AdminUserUpdateSerializer, RosterSerializer, TicketSerializer,
    HouseSerializer, AttendanceSerializer, PointsSerializer, ResultSerializer, AuditSerializer,
    SettingSerializer, SETTING_DEFAULTS)
from .operations import check_in, correct_attendance, post_points, reverse_points


def effective_points():
    return PointsTransaction.objects.filter(is_approved=True, is_reversed=False)


def houses_with_totals():
    from apps.seasons.scope import current_season
    season = current_season()
    member_filter = Q(members__is_active=True, members__role="STUDENT")
    if season:
        member_filter &= Q(members__season_memberships__season=season)
    points = effective_points().filter(house=OuterRef("pk")).values("house").annotate(total=Sum("points")).values("total")
    return House.objects.annotate(actual_members=Count("members", filter=member_filter, distinct=True),
        actual_points=Coalesce(Subquery(points, output_field=IntegerField()), Value(0))).order_by("-actual_points", "name")


class AdminBase(viewsets.GenericViewSet):
    lookup_value_regex = r"\d+"
    permission_classes = [IsSchoolAdmin]
    pagination_class = ApiPagination


class UsersViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, AdminBase):
    serializer_class = AdminUserSerializer

    @transaction.atomic
    def destroy(self, request, pk=None):
        user = get_object_or_404(User.objects.select_for_update(), pk=pk)
        if user.pk == request.user.pk or user.role != "STUDENT" or user.is_superuser:
            raise Conflict("Only student accounts can be deleted. You cannot delete your own account.")
        if (EventRegistration.all_objects.filter(user=user).exists()
                or Attendance.all_objects.filter(user=user).exists()
                or PointsTransaction.all_objects.filter(user=user).exists()
                or EventResult.all_objects.filter(user=user).exists()
                or Event.all_objects.filter(organizer=user).exists()
                or ScanLog.all_objects.filter(user=user).exists()):
            raise Conflict("This student has event, attendance, or points history. Disable the account instead to preserve those records.")
        # Preserve ticket redemption history and prevent accidental reactivation.
        StudentRoster.objects.filter(account=user).update(is_eligible=False)
        if user.house_id:
            House.objects.filter(pk=user.house_id).update(member_count=Greatest(F("member_count") - 1, 0))
        if user.season_memberships.exists():
            raise Conflict("This student has season participation records. Disable the account instead, or purge its closed seasons first.")
        user.delete()
        return Response(status=204)

    def get_queryset(self):
        qs = User.objects.select_related("house").order_by("student_id")
        search = self.request.query_params.get("search", "")
        if search:
            qs = qs.filter(Q(student_id__icontains=search) | Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(email__icontains=search))
        role = self.request.query_params.get("role")
        if role:
            role = serializers.ChoiceField(choices=User.ROLE_CHOICES).run_validation(role)
            qs = qs.filter(role=role)
        for key in ("house", "year_level"):
            value = self.request.query_params.get(key)
            if value:
                if key == "house" and value == "unassigned":
                    qs = qs.filter(house__isnull=True)
                else:
                    qs = qs.filter(**{key: serializers.IntegerField(min_value=1).run_validation(value)})
        if self.request.query_params.get("program"):
            qs = qs.filter(program=self.request.query_params["program"])
        if self.request.query_params.get("is_active"):
            qs = qs.filter(is_active=serializers.BooleanField().run_validation(self.request.query_params["is_active"]))
        return qs

    @action(detail=False, methods=["get"], url_path="filter-options")
    def filter_options(self, request):
        return Response({"programs": list(User.objects.exclude(program="").order_by("program").values_list("program", flat=True).distinct()),
            "year_levels": list(User.objects.order_by("year_level").values_list("year_level", flat=True).distinct()),
            "houses": list(House.objects.order_by("name").values("id", "name")),
            "roles": [{"value": value, "label": label, "count": User.objects.filter(role=value).count()} for value, label in User.ROLE_CHOICES]})

    @transaction.atomic
    def partial_update(self, request, pk=None):
        user = get_object_or_404(User.objects.select_for_update(), pk=pk)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminUserSerializer(user).data)


class RosterViewSet(viewsets.ModelViewSet):
    lookup_value_regex = r"\d+"
    permission_classes = [IsSchoolAdmin]
    pagination_class = ApiPagination
    serializer_class = RosterSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = StudentRoster.objects.order_by("student_number")
        search = self.request.query_params.get("search", "")
        return qs.filter(Q(student_number__icontains=search) | Q(last_name__icontains=search) | Q(first_name__icontains=search)) if search else qs

    @transaction.atomic
    def partial_update(self, request, pk=None):
        record = get_object_or_404(StudentRoster.objects.select_for_update(), pk=pk)
        if record.account_id:
            raise Conflict("Activated roster identities are locked. Manage the account under Users.")
        serializer = self.get_serializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @transaction.atomic
    def destroy(self, request, pk=None):
        record = get_object_or_404(StudentRoster.objects.select_for_update(), pk=pk)
        if record.account_id or IntramuralsTicket.objects.filter(redeemed_by=record).exists():
            raise Conflict("Activated roster records cannot be deleted.")
        record.delete()
        return Response(status=204)

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def bulk(self, request):
        rows = request.data.get("rows")
        if "csv" in request.data:
            raw = serializers.CharField(max_length=5_000_000).run_validation(request.data["csv"])
            rows = list(csv.DictReader(io.StringIO(raw.lstrip("\ufeff"))))
        if not isinstance(rows, list) or not 1 <= len(rows) <= 5000:
            raise ValidationError("Provide 1–5,000 roster rows.")
        serializer = self.get_serializer(data=rows, many=True)
        serializer.is_valid(raise_exception=True)
        numbers = [row["student_number"] for row in serializer.validated_data]
        if len(set(numbers)) != len(numbers):
            raise ValidationError("Student numbers must be unique within the import.")
        serializer.save()
        return Response({"created": len(rows)}, status=201)


class TicketsViewSet(mixins.ListModelMixin, AdminBase):
    serializer_class = TicketSerializer
    queryset = IntramuralsTicket.objects.order_by("-issued_at", "-pk")

    @action(detail=False, methods=["get"])
    def export(self, request):
        from django.http import HttpResponse
        from apps.seasons.scope import current_season

        season = current_season()
        if season is None:
            raise ValidationError("Select a current season before downloading tickets.")
        tickets = IntramuralsTicket.objects.filter(
            season=season, status="AVAILABLE", redeemed_by__isnull=True,
            redeemed_at__isnull=True,
        ).order_by("ticket_number")
        if not tickets.exists():
            raise ValidationError("No available tickets to download in the current season.")
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="available-activation-tickets.csv"'
        response["Cache-Control"] = "no-store"
        response.write("\ufeff")
        writer = csv.writer(response)
        writer.writerow(["Ticket number", "QR token"])
        writer.writerows(tickets.values_list("ticket_number", "qr_token").iterator())
        return response

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search", "")
        return qs.filter(ticket_number__icontains=search) if search else qs

    @action(detail=False, methods=["get"])
    def template(self, request):
        from django.http import HttpResponse
        from .ticket_import import template_bytes
        response = HttpResponse(template_bytes(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = 'attachment; filename="activation-tickets-template.xlsx"'
        return response

    @action(detail=False, methods=["post"], url_path="import")
    def import_excel(self, request):
        from .ticket_import import read_ticket_numbers
        numbers = read_ticket_numbers(request.FILES.get("file"))
        if IntramuralsTicket.all_objects.filter(ticket_number__in=numbers).exists():
            raise ValidationError("A ticket number already exists. Nothing was imported.")
        try:
            with transaction.atomic():
                from apps.seasons.scope import current_season_id
                season_id = current_season_id()
                rows = [IntramuralsTicket(season_id=season_id, ticket_number=number, qr_token=secrets.token_urlsafe(32), issued_at=timezone.now()) for number in numbers]
                IntramuralsTicket.objects.bulk_create(rows)
        except IntegrityError:
            raise ValidationError("A ticket number already exists. Nothing was imported.")
        return Response(TicketSerializer(rows, many=True).data, status=201)

    @transaction.atomic
    def destroy(self, request, pk=None):
        ticket = get_object_or_404(IntramuralsTicket.objects.select_for_update(), pk=pk)
        if ticket.status == "REDEEMED" or ticket.redeemed_by_id or ticket.redeemed_at:
            raise Conflict("Redeemed tickets must be retained as activation history.")
        ticket.delete()
        return Response(status=204)

    @action(detail=False, methods=["post"], url_path="batch-delete")
    @transaction.atomic
    def batch_delete(self, request):
        ids = serializers.ListField(child=serializers.IntegerField(min_value=1), min_length=1, max_length=500).run_validation(request.data.get("ids"))
        tickets = list(IntramuralsTicket.objects.select_for_update().filter(pk__in=ids).order_by("pk"))
        if len(tickets) != len(set(ids)):
            raise ValidationError("Some selected tickets no longer exist in this season. Refresh and try again.")
        if any(t.status == "REDEEMED" or t.redeemed_by_id or t.redeemed_at for t in tickets):
            raise Conflict("Redeemed tickets cannot be deleted. Nothing was deleted.")
        IntramuralsTicket.objects.filter(pk__in=ids).delete()
        return Response({"deleted": len(tickets)})

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def generate(self, request):
        count = serializers.IntegerField(min_value=1, max_value=500).run_validation(request.data.get("count"))
        rows = []
        for _ in range(count):
            while True:
                number = str(secrets.randbelow(900000000000) + 100000000000)
                if not IntramuralsTicket.all_objects.filter(ticket_number=number).exists():
                    break
            rows.append(IntramuralsTicket.objects.create(ticket_number=number, qr_token=secrets.token_urlsafe(32), issued_at=timezone.now()))
        return Response(TicketSerializer(rows, many=True).data, status=201)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def toggle(self, request, pk=None):
        ticket = get_object_or_404(IntramuralsTicket.objects.select_for_update(), pk=pk)
        if ticket.status == "REDEEMED":
            raise Conflict("Redeemed tickets cannot be changed.")
        ticket.status = "AVAILABLE" if ticket.status == "DISABLED" else "DISABLED"
        ticket.save()
        return Response(TicketSerializer(ticket).data)


class HousesViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, AdminBase):
    serializer_class = HouseSerializer

    @transaction.atomic
    def destroy(self, request, pk=None):
        house = get_object_or_404(House.objects.select_for_update(), pk=pk)
        if house.members.exists():
            raise Conflict("Reassign or remove all students from this house before deleting it, including disabled accounts.")
        if (PointsTransaction.all_objects.filter(house=house).exists()
                or EventResult.all_objects.filter(house=house).exists() or house.standings.exists()):
            raise Conflict("This house has points, results, or standings history. Deactivate it instead to preserve those records.")
        if any(house.pk in (ids or []) or str(house.pk) in (ids or [])
               for ids in Event.all_objects.values_list("allowed_houses", flat=True)):
            raise Conflict("Remove this house from event audience restrictions before deleting it.")
        house.delete()
        return Response(status=204)
    def get_queryset(self):
        return houses_with_totals().filter(name__icontains=self.request.query_params.get("search", ""))


class AttendanceViewSet(mixins.ListModelMixin, AdminBase):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        qs = Attendance.objects.select_related("event", "user", "user__house").order_by("-scanned_at", "-pk")
        qs = filter_event_period(qs, self.request.query_params, "event__")
        for key in ("house", "year_level"):
            value = self.request.query_params.get(key)
            if value:
                qs = qs.filter(**{f"user__{key}": serializers.IntegerField(min_value=1).run_validation(value)})
        if self.request.query_params.get("program"):
            qs = qs.filter(user__program=self.request.query_params["program"])
        if self.request.query_params.get("is_valid"):
            qs = qs.filter(is_valid=serializers.BooleanField().run_validation(self.request.query_params["is_valid"]))
        event = self.request.query_params.get("event")
        if event:
            event = serializers.IntegerField(min_value=1).run_validation(event)
            qs = qs.filter(event_id=event)
        search = self.request.query_params.get("search", "")
        if search:
            qs = qs.filter(Q(user__student_id__icontains=search) | Q(user__first_name__icontains=search) | Q(user__last_name__icontains=search) | Q(event__title__icontains=search))
        return qs

    @action(detail=False, methods=["post"])
    def check_in(self, request):
        event_id = serializers.IntegerField(min_value=1).run_validation(request.data.get("event"))
        student_id = request.data.get("student_id")
        token = request.data.get("token")
        if not student_id and not token:
            raise ValidationError("Enter a student number or scan a QR pass.")
        try:
            row, created = check_in(request.user, event_id, student_id, token)
        except (ValidationError, Conflict) as exc:
            ScanLog.objects.create(event_id=event_id if Event.objects.filter(pk=event_id).exists() else None,
                scanned_by=request.user, success=False, failure_reason=str(exc.detail)[:255])
            raise
        return Response(AttendanceSerializer(row).data, status=201 if created else 200)

    @action(detail=True, methods=["post"])
    def correct(self, request, pk=None):
        valid = serializers.BooleanField().run_validation(request.data.get("is_valid"))
        reason = serializers.CharField(min_length=3, max_length=1000).run_validation(request.data.get("reason"))
        return Response(AttendanceSerializer(correct_attendance(request.user, pk, valid, reason)).data)

    @action(detail=False, methods=["get"])
    def export(self, request):
        class Echo:
            def write(self, value): return value
        writer = csv.writer(Echo())
        def safe(value):
            text = str(value)
            return "'" + text if text.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")) else text
        def rows():
            yield writer.writerow(["Event", "Event date", "Archived", "Student number", "Student name", "House (current)", "Program (current)", "Year level (current)", "Scanned at", "Method", "Valid"])
            for row in self.get_queryset().iterator(chunk_size=1000):
                yield writer.writerow([safe(row.event.title), row.event.event_date.isoformat(), bool(row.event.archived_at), safe(row.user.student_id), safe(row.user.get_full_name()), safe(row.user.house.name if row.user.house else ""), safe(row.user.program), row.user.year_level, row.scanned_at.isoformat(), row.scan_method, row.is_valid])
        response = StreamingHttpResponse(rows(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="attendance.csv"'
        return response


class PointsViewSet(mixins.ListModelMixin, AdminBase):
    serializer_class = PointsSerializer
    def get_queryset(self):
        qs = PointsTransaction.objects.select_related("user", "house", "event").order_by("-created_at", "-pk")
        search = self.request.query_params.get("search", "")
        return qs.filter(Q(reason__icontains=search) | Q(user__student_id__icontains=search)) if search else qs

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def award(self, request):
        key = serializers.UUIDField().run_validation(request.data.get("idempotency_key"))
        points = serializers.IntegerField(min_value=-100000, max_value=100000).run_validation(request.data.get("points"))
        if not points:
            raise ValidationError("Points cannot be zero.")
        reason = serializers.CharField(min_length=3, max_length=1000).run_validation(request.data.get("reason"))
        user_id = request.data.get("user")
        house_id = request.data.get("house")
        if user_id:
            user_id = serializers.IntegerField(min_value=1).run_validation(user_id)
        if house_id:
            house_id = serializers.IntegerField(min_value=1).run_validation(house_id)
        if bool(user_id) == bool(house_id):
            raise ValidationError("Choose exactly one student or house.")
        user = get_object_or_404(User.objects.select_related("house"), pk=user_id, role="STUDENT") if user_id else None
        house = get_object_or_404(House, pk=house_id) if house_id else None
        source = f"manual:{key}"
        existing = PointsTransaction.objects.filter(source_key=source).first()
        if existing:
            if existing.user_id != (user.pk if user else None) or existing.points != points or existing.reason != reason or (not user and existing.house_id != house.pk):
                raise Conflict("This request key was already used for a different award.")
            return Response(PointsSerializer(existing).data)
        entry, created = post_points(user=user, house=house, points=points, source_key=source, actor=request.user,
                                     reason=reason, kind="PENALTY" if points < 0 else "MANUAL_ADJUSTMENT")
        return Response(PointsSerializer(entry).data, status=201 if created else 200)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def reverse(self, request, pk=None):
        reference = get_object_or_404(PointsTransaction, pk=pk)
        if reference.result_id:
            Event.objects.select_for_update().get(pk=reference.event_id)
            EventResult.objects.select_for_update().get(pk=reference.result_id)
        entry = get_object_or_404(PointsTransaction.objects.select_for_update(), pk=pk)
        if (entry.source_key or "").startswith("attendance:"):
            raise Conflict("Correct the attendance record to reverse its participation points.")
        reason = serializers.CharField(min_length=3, max_length=1000).run_validation(request.data.get("reason"))
        reverse_points(entry, request.user, reason)
        if entry.result_id:
            EventResult.objects.filter(pk=entry.result_id).update(is_verified=False)
        return Response(PointsSerializer(entry).data)


class ResultsViewSet(mixins.ListModelMixin, AdminBase):
    serializer_class = ResultSerializer
    queryset = EventResult.objects.select_related("event", "user", "house").order_by("-posted_at", "-pk")

    def get_queryset(self):
        return super().get_queryset().filter(event__title__icontains=self.request.query_params.get("search", ""))

    @transaction.atomic
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = Event.objects.select_for_update().get(pk=serializer.validated_data["event"].pk)
        if event.status not in ("ONGOING", "COMPLETED"):
            raise Conflict("Results can only be posted for ongoing or completed events.")
        user = serializer.validated_data.get("user")
        if user and not Attendance.objects.filter(event=event, user=user, is_valid=True).exists():
            raise Conflict("An individual result requires valid attendance.")
        kind = serializer.validated_data.get("result_type", "INDIVIDUAL")
        if kind != "INDIVIDUAL" and EventResult.objects.filter(event=event, result_type=kind,
                house=serializer.validated_data.get("house"), team_name=serializer.validated_data.get("team_name", "")).exists():
            raise Conflict("A result already exists for this team or house.")
        rank = serializer.validated_data["rank"]
        points = [event.first_place_points, event.second_place_points, event.third_place_points][rank - 1]
        result = serializer.save(is_verified=True, verified_by=request.user, verified_at=timezone.now(), points_awarded=points)
        post_points(user=result.user, house=result.house, points=points, source_key=f"result:{result.pk}", actor=request.user,
                    reason=f"Place {rank}: {event.title}", kind="PERFORMANCE", event=event, result=result)
        return Response(self.get_serializer(result).data, status=201)


    @action(detail=True, methods=["post"])
    @transaction.atomic
    def correct(self, request, pk=None):
        import uuid
        rank = serializers.IntegerField(min_value=1, max_value=3).run_validation(request.data.get("rank"))
        reason = serializers.CharField(min_length=3, max_length=1000).run_validation(request.data.get("reason"))
        ref = get_object_or_404(EventResult, pk=pk)
        event = Event.objects.select_for_update().get(pk=ref.event_id)
        result = EventResult.objects.select_for_update().get(pk=pk)
        if result.rank == rank and result.is_verified:
            return Response(self.get_serializer(result).data)
        for entry in PointsTransaction.objects.select_for_update().filter(result=result, is_reversed=False):
            reverse_points(entry, request.user, reason)
        result.rank = rank
        result.points_awarded = [event.first_place_points, event.second_place_points, event.third_place_points][rank - 1]
        result.is_verified = True
        result.verified_by = request.user
        result.verified_at = timezone.now()
        result.notes = reason
        result.save()
        post_points(user=result.user, house=result.house, points=result.points_awarded,
                    source_key=f"result-correction:{uuid.uuid4()}", actor=request.user, reason=reason,
                    kind="PERFORMANCE", event=event, result=result)
        return Response(self.get_serializer(result).data)


class AuditViewSet(mixins.ListModelMixin, AdminBase):
    serializer_class = AuditSerializer
    def get_queryset(self):
        qs = AuditLog.objects.order_by("-created_at", "-pk")
        search = self.request.query_params.get("search", "")
        return qs.filter(Q(user_email__icontains=search) | Q(action__icontains=search)) if search else qs


class SettingsViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, AdminBase):
    serializer_class = SettingSerializer
    queryset = SystemSetting.objects.filter(key__in=SETTING_DEFAULTS).order_by("key")
    def get_queryset(self):
        return super().get_queryset().filter(key__icontains=self.request.query_params.get("search", ""))

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


@api_view(["GET"])
@permission_classes([IsSchoolAdmin])
def dashboard(request):
    from apps.seasons.scope import current_season
    season = current_season()
    students = User.objects.filter(role="STUDENT", is_active=True)
    if season:
        students = students.filter(season_memberships__season=season)
    return Response({"students": students.count(),
        "events": Event.objects.count(), "ongoing": Event.objects.filter(status="ONGOING").count(),
        "registrations": EventRegistration.objects.exclude(status="CANCELLED").count(),
        "attendance": Attendance.objects.filter(is_valid=True).count(),
        "points": effective_points().aggregate(total=Sum("points"))["total"] or 0,
        "houses": HouseSerializer(houses_with_totals(), many=True, context={"request": request}).data,
        "recent": AuditSerializer(AuditLog.objects.order_by("-created_at")[:8], many=True).data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def field_limits(request):
    from apps.events.serializers import EventSerializer, EventCategorySerializer
    from apps.results.management import MatchAdminSerializer
    from apps.seasons.views import SeasonSerializer
    resources = {
        "/events/categories/": EventCategorySerializer, "/events/": EventSerializer,
        "/admin/users/": AdminUserUpdateSerializer, "/admin/roster/": RosterSerializer,
        "/admin/houses/": HouseSerializer, "/admin/results/": ResultSerializer,
        "/admin/settings/": SettingSerializer, "/admin/matchups/": MatchAdminSerializer,
        "/seasons/": SeasonSerializer,
    }
    return Response({path: {name: field.max_length for name, field in serializer().fields.items()
                           if isinstance(field, serializers.CharField) and not field.read_only and field.max_length}
                     for path, serializer in resources.items()})
