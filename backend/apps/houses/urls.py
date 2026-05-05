# apps/houses/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_houses, name='house-list'),     # GET /api/houses/
    path('add/', views.add_house, name='house-add'),    # POST /api/houses/add/
]