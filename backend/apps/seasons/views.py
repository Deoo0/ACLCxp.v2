from apps.core.text_limits import LimitedModelSerializer
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from apps.authentication.views import AccountActivationThrottle
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.core.permissions import IsSchoolAdmin
from apps.core.pagination import ApiPagination
from apps.events.services import Conflict
from apps.users.models import User, IntramuralsTicket, StudentRoster
from apps.houses.models import House
from .models import Season, SeasonMembership
from .scope import current_season
from .archive import archive, purge_records, season_records


class SeasonSerializer(LimitedModelSerializer):
    class Meta:
        model = Season
        fields = ["id", "name", "status", "is_current", "starts_on", "ends_on", "closed_at", "exported_at", "purged_at"]
        read_only_fields = ["status", "is_current", "closed_at", "exported_at", "purged_at"]

    def validate(self, attrs):
        start, end = attrs.get("starts_on"), attrs.get("ends_on")
        if start and end and end < start:
            raise serializers.ValidationError("End date must follow the start date.")
        return attrs


class SeasonViewSet(viewsets.GenericViewSet):
    permission_classes = [IsSchoolAdmin]
    serializer_class = SeasonSerializer
    pagination_class = ApiPagination
    queryset = Season.objects.all()

    def list(self, request):
        qs = self.get_queryset().filter(name__icontains=request.query_params.get("search", ""))
        return self.get_paginated_response(self.get_serializer(self.paginate_queryset(qs), many=True).data)

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def transition(self, request, pk=None):
        list(Season.objects.select_for_update().order_by("pk"))
        season = self.get_object()
        target = serializers.ChoiceField(choices=["REGISTRATION", "ACTIVE", "CLOSED"]).run_validation(request.data.get("status"))
        allowed = {"DRAFT": ["REGISTRATION", "ACTIVE"], "REGISTRATION": ["ACTIVE", "CLOSED"], "ACTIVE": ["CLOSED"], "CLOSED": []}
        if target not in allowed[season.status]:
            raise Conflict("This season transition is not allowed. Closed seasons cannot be reopened.")
        current = current_season()
        if current and current.pk != season.pk and current.status != "CLOSED":
            raise Conflict("Close the current season before opening another.")
        if not current and season.status == "DRAFT":
            # Explicitly adopt legacy operational records and preserve existing access.
            if request.data.get("adopt_existing") is not True:
                raise Conflict("For the first season, confirm adoption of existing data and student access.")
            from django.apps import apps
            for app, model in [("events", "Event"), ("results", "PointsTransaction"), ("users", "IntramuralsTicket"), ("analytics", "AuditLog"), ("attendance", "ScanLog"), ("houses", "HouseStanding"), ("notifications", "Notification"), ("notifications", "EmailLog")]:
                apps.get_model(app, model).all_objects.filter(season__isnull=True).update(season=season)
            SeasonMembership.objects.bulk_create([SeasonMembership(season=season, user=user) for user in User.objects.filter(role="STUDENT", is_active=True)])
        if target == "CLOSED":
            season.closed_at = timezone.now()
        else:
            Season.objects.exclude(pk=season.pk).update(is_current=False)
            season.is_current = True
        season.status = target
        season.save()
        from apps.analytics.console import houses_with_totals
        # Rebuild cached public totals for the selected season, rather than carrying them forward.
        for house in houses_with_totals():
            House.objects.filter(pk=house.pk).update(total_points=house.actual_points, member_count=house.actual_members, current_rank=None, total_wins=0, total_participations=0)
        return Response(self.get_serializer(season).data)

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        season = self.get_object()
        return Response({key: qs.count() for key, qs in season_records(season).items()})

    @action(detail=True, methods=["post"], url_path="export")
    @transaction.atomic
    def export_season(self, request, pk=None):
        season = Season.objects.select_for_update().get(pk=self.get_object().pk)
        if season.status != "CLOSED" or season.purged_at:
            raise Conflict("Close the season before exporting. Purged seasons cannot be exported again.")
        content, digest, missing = archive(season)
        season.exported_at = timezone.now()
        season.export_digest = digest
        season.save()
        response = HttpResponse(content, content_type="application/zip")
        response["Content-Disposition"] = f'attachment; filename="season-{season.pk}-export.zip"'
        response["X-Season-Export-Digest"] = digest
        response["Access-Control-Expose-Headers"] = "X-Season-Export-Digest, Content-Disposition"
        return response

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def purge(self, request, pk=None):
        season = Season.objects.select_for_update().get(pk=self.get_object().pk)
        if season.status != "CLOSED" or season.purged_at or not season.exported_at:
            raise Conflict("Only an exported, closed season can be purged.")
        if request.data.get("confirmation") != season.name or request.data.get("export_saved") is not True:
            raise serializers.ValidationError("Type the exact season name and confirm that you saved its export.")
        _, digest, missing = archive(season)
        if missing:
            raise Conflict("Some event media files are missing. Restore those files before exporting and purging.")
        if request.data.get("export_digest") != digest or season.export_digest != digest:
            raise Conflict("The export does not match the current records. Download a fresh export first.")
        purge_records(season)
        season.purged_at = timezone.now()
        season.save()
        if season.is_current:
            House.objects.update(total_points=0, member_count=0, total_wins=0, total_participations=0, current_rank=None)
        return Response({"detail": "Season records purged. Accounts, roster, houses, categories and settings were retained."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def access(request):
    season = current_season()
    enrolled = bool(season and SeasonMembership.objects.filter(season=season, user=request.user).exists())
    return Response({"season": SeasonSerializer(season).data if season else None, "enrolled": enrolled,
                     "can_access": not season or (season.status == "ACTIVE" and enrolled), "can_redeem": bool(season and season.status in ("REGISTRATION", "ACTIVE") and not enrolled)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([AccountActivationThrottle])
@transaction.atomic
def redeem(request):
    season = current_season()
    if not season or season.status not in ("REGISTRATION", "ACTIVE") or request.user.role != "STUDENT":
        raise Conflict("Season registration is not open.")
    if SeasonMembership.objects.filter(season=season, user=request.user).exists():
        return Response({"detail": "You are already enrolled in this season."})
    number = serializers.CharField(max_length=12).run_validation(request.data.get("ticket_number"))
    ticket = IntramuralsTicket.objects.select_for_update().filter(ticket_number=number, season=season, status="AVAILABLE").first()
    roster = StudentRoster.objects.filter(account=request.user, is_eligible=True).first()
    if not ticket or ticket.redeemed_by_id or not roster:
        raise serializers.ValidationError("A valid unused current-season ticket and eligible student roster entry are required.")
    ticket.status = "REDEEMED"
    ticket.redeemed_by = roster
    ticket.redeemed_at = timezone.now()
    ticket.save()
    SeasonMembership.objects.create(season=season, user=request.user, ticket=ticket)
    return Response({"detail": "Season activated. Your dashboard unlocks when the season starts."})
