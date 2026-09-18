from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

# from apps.houses.views import HouseViewSet

router = DefaultRouter()
# router.register(r'houses', HouseViewSet, basename='house')

urlpatterns = [
    path("registration/verify-ticket/", views.verify_ticket, name="verify_ticket"),
    path("registration/verify-student/", views.verify_student, name="verify_student"),
    path("registration/activate/", views.activate_account, name="activate_account"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("token/refresh/", views.refresh_token, name="token_refresh"),
    path("me/", views.me, name="auth-me"),
]
