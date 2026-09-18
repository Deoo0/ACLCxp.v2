from django.contrib import admin
from .models import IntramuralsTicket, StudentRoster


@admin.register(StudentRoster)
class StudentRosterAdmin(admin.ModelAdmin):
    list_display = ("student_number", "last_name", "first_name", "program", "year_level", "is_eligible", "account")
    list_filter = ("is_eligible", "program", "year_level")
    search_fields = ("student_number", "first_name", "last_name")


@admin.register(IntramuralsTicket)
class IntramuralsTicketAdmin(admin.ModelAdmin):
    list_display = ("ticket_number", "status", "redeemed_by", "issued_at", "redeemed_at")
    list_filter = ("status",)
    search_fields = ("ticket_number", "qr_token", "redeemed_by__student_number")
    readonly_fields = ("redeemed_at",)
