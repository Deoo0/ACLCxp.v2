from .models import AuditLog


class AuditMiddleware:
    """Record write outcomes without passwords, tokens, request bodies or response data."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith("/api/") and not request.path.startswith("/api/auth/") and request.method in ("POST", "PUT", "PATCH", "DELETE"):
            user = getattr(request, "user", None)
            if user and user.is_authenticated:
                AuditLog.objects.create(user=user, user_email=user.email, user_role=user.role,
                    action=f"{request.method} {request.path}"[:100], resource_type=request.path.split("/")[2].upper(),
                    description=f"{request.method} {request.path}: HTTP {response.status_code}",
                    status="SUCCESS" if response.status_code < 400 else "FAILURE",
                    request_method=request.method, request_path=request.path[:500])
        return response
