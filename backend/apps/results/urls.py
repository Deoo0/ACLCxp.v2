from django.urls import path
from .views import CompetitionFeed

urlpatterns = [path("", CompetitionFeed.as_view(), name="competition-feed")]
