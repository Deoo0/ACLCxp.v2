from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
#from apps.houses.views import HouseViewSet

router = DefaultRouter()
#router.register(r'houses', HouseViewSet, basename='house')

urlpatterns = [
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('token/refresh/', views.refresh_token, name='token_refresh'),
]