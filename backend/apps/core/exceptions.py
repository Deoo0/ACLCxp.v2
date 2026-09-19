from django.db import IntegrityError
from rest_framework.views import exception_handler
from rest_framework.response import Response


def api_exception_handler(exc, context):
    if isinstance(exc, IntegrityError):
        return Response({"detail": "This change conflicts with an existing record. Refresh and check for duplicates."}, status=409)
    return exception_handler(exc, context)
