from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.events.views import EventViewSet, EventCategoryViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'categories', EventCategoryViewSet, basename='category')

urlpatterns = router.urls