from rest_framework.permissions import BasePermission


def is_admin(user):
    return bool(user and user.is_authenticated and user.is_active and
                (user.is_superuser or user.role == "ADMIN"))


def can_manage_event(user, event):
    return is_admin(user) or bool(user and user.is_authenticated and user.is_active
                                 and user.role == "ORGANIZER" and event.organizer_id == user.pk)


class IsSchoolAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class IsEventCreator(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return is_admin(user) or bool(user.is_authenticated and user.is_active and user.role == "ORGANIZER")
