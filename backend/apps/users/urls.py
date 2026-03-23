from django.urls import path
from . import views

urlpatterns=[
    path('health/', views.health_check, name='health_check'),
    path('echo/', views.echo_test, name='echo_test'),
]