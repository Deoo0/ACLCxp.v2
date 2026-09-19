from rest_framework import serializers


def filter_event_period(queryset, params, prefix=""):
    archive = params.get("archive", "active")
    if archive not in ("active", "archived", "all"):
        raise serializers.ValidationError({"archive": "Choose active, archived, or all."})
    if archive != "all":
        queryset = queryset.filter(**{f"{prefix}archived_at__isnull": archive == "active"})
    if params.get("year"):
        year = serializers.IntegerField(min_value=1900, max_value=9999).run_validation(params["year"])
        queryset = queryset.filter(**{f"{prefix}event_date__year": year})
    return queryset
