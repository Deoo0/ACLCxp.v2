from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventCategoryViewSet

router = DefaultRouter()
router.register("categories", EventCategoryViewSet, basename="event-category")
router.register("", EventViewSet, basename="event")
urlpatterns = router.urls
