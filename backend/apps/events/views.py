from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.db.models import OuterRef, Subquery
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.core.pagination import ApiPagination
from apps.core.permissions import IsSchoolAdmin, IsEventCreator, can_manage_event, is_admin
from .models import Event, EventCategory, EventRegistration
from .serializers import EventSerializer, EventCategorySerializer, RegistrationSerializer, CancellationSerializer
from .services import Conflict, visible_events, register_locked, cancel_locked, update_locked


class EventCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = EventCategorySerializer
    pagination_class = ApiPagination

    def get_permissions(self):
        return [AllowAny()] if self.action in ("list", "retrieve") else [IsSchoolAdmin()]

    def get_queryset(self):
        queryset = EventCategory.objects.filter(name__icontains=self.request.query_params.get("search", "")).order_by("display_order", "pk")
        return queryset if is_admin(self.request.user) else queryset.filter(is_active=True)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise Conflict("This category has events. Deactivate it instead.")


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    pagination_class = ApiPagination

    def get_permissions(self):
        if self.action == "create":
            return [IsEventCreator()]
        return [AllowAny()] if self.action in ("list", "retrieve") else [IsAuthenticated()]

    def get_queryset(self):
        queryset = visible_events(Event.objects.select_related("category"), self.request.user)
        if self.request.user.is_authenticated:
            queryset = queryset.annotate(registration_status=Subquery(EventRegistration.objects.filter(event=OuterRef("pk"), user=self.request.user).values("status")[:1]))
        if self.action == "list":
            search = self.request.query_params.get("search", "")
            if search:
                queryset = queryset.filter(title__icontains=search)
            for field in ("status", "category"):
                value = self.request.query_params.get(field)
                if value:
                    if field == "category" and not value.isdecimal():
                        raise ValidationError({"category": "Expected a numeric category ID."})
                    if field == "status" and value not in dict(Event.STATUS_CHOICES):
                        raise ValidationError({"status": "Unknown event status."})
                    queryset = queryset.filter(**{field: value})
        return queryset.order_by("event_date", "start_time", "pk")

    def perform_create(self, serializer):
        if not is_admin(self.request.user) and self.request.user.role != "ORGANIZER":
            raise PermissionDenied("Only administrators and organizers may create events.")
        try:
            with transaction.atomic():
                serializer.save(organizer=self.request.user,
                                published_at=timezone.now() if serializer.validated_data.get("status") == "PUBLISHED" else None)
        except IntegrityError:
            raise Conflict("An event with that identifier already exists.")

    def update(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                # Do not join nullable relations while acquiring PostgreSQL locks.
                event = get_object_or_404(Event.objects.select_for_update(), pk=kwargs["pk"])
                if not can_manage_event(request.user, event):
                    raise PermissionDenied("You cannot manage this event.")
                serializer = self.get_serializer(event, data=request.data, partial=kwargs.get("partial", False))
                serializer.is_valid(raise_exception=True)
                update_locked(event, serializer)
                return Response(serializer.data)
        except IntegrityError:
            raise Conflict("This update conflicts with an existing event or database constraint.")

    def destroy(self, request, *args, **kwargs):
        with transaction.atomic():
            event = get_object_or_404(Event.objects.select_for_update(), pk=kwargs["pk"])
            if not can_manage_event(request.user, event):
                raise PermissionDenied("You cannot manage this event.")
            if event.status != "DRAFT" or event.registrations.exists() or event.attendance_records.exists() or event.results.exists():
                raise Conflict("Only unused drafts can be deleted. Cancel published events instead.")
            event.delete()
        return Response(status=204)

    @action(detail=True, methods=["post"], url_path="register")
    def register(self, request, pk=None):
        if request.data:
            raise ValidationError("Registration uses your signed-in identity; send an empty body.")
        with transaction.atomic():
            event = get_object_or_404(Event.objects.select_for_update(), pk=pk)
            # Avoid exposing drafts/private or ineligible events through registration.
            get_object_or_404(visible_events(Event.objects.filter(pk=event.pk), request.user))
            registration, changed = register_locked(event, request.user)
            return Response({"status": "success", "data": RegistrationSerializer(registration).data}, status=201 if changed else 200)

    @action(detail=True, methods=["post"], url_path="cancel-registration")
    def cancel_registration(self, request, pk=None):
        serializer = CancellationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            event = get_object_or_404(Event.objects.select_for_update(), pk=pk)
            registration = cancel_locked(event, request.user, serializer.validated_data["reason"])
            return Response({"status": "success", "data": RegistrationSerializer(registration).data})

    @action(detail=True, methods=["get"], url_path="registrations")
    def registrations(self, request, pk=None):
        event = get_object_or_404(Event, pk=pk)
        if not can_manage_event(request.user, event):
            raise PermissionDenied("Only the organizer or an administrator may view registrations.")
        records = event.registrations.select_related("event", "user").order_by("registered_at", "pk")
        page = self.paginate_queryset(records)
        return self.get_paginated_response(RegistrationSerializer(page, many=True).data)

    @action(detail=False, methods=["get"], url_path="my-registrations")
    def my_registrations(self, request):
        records = EventRegistration.objects.filter(user=request.user, event__title__icontains=request.query_params.get("search", "")).select_related("event", "user").order_by("-registered_at", "-pk")
        page = self.paginate_queryset(records)
        return self.get_paginated_response(RegistrationSerializer(page, many=True).data)
