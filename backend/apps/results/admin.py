from django.contrib import admin
from .models import EventResult, MatchAnnouncement


@admin.register(MatchAnnouncement)
class MatchAnnouncementAdmin(admin.ModelAdmin):
    list_display = ["event", "label", "team_one", "team_two", "scheduled_at", "is_published"]
    list_filter = ["is_published", "event"]
    search_fields = ["team_one", "team_two", "event__title"]


@admin.register(EventResult)
class EventResultAdmin(admin.ModelAdmin):
    list_display = ["event", "result_type", "team_name", "house", "rank", "score", "is_verified"]
    list_filter = ["is_verified", "result_type", "event"]
    search_fields = ["team_name", "event__title"]
    readonly_fields = ["verified_by", "verified_at"]

    def save_model(self, request, obj, form, change):
        from django.utils import timezone
        if obj.is_verified and (not change or "is_verified" in form.changed_data):
            obj.verified_by = request.user
            obj.verified_at = timezone.now()
        elif not obj.is_verified:
            obj.verified_by = None
            obj.verified_at = None
        super().save_model(request, obj, form, change)
