from django.urls import path, include
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("api/weather/", views.weather, name="weather"),
    path("api/preferences/", views.preferences, name="preferences"),
    path("accounts/signup/", views.signup, name="signup"),
    path("accounts/", include("django.contrib.auth.urls")),
]
