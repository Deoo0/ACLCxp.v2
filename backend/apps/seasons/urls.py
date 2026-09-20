from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeasonViewSet, access, redeem
router = DefaultRouter()
router.register("", SeasonViewSet, basename="season")
urlpatterns = [path("access/", access), path("redeem/", redeem), path("", include(router.urls))]
