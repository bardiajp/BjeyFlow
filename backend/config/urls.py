from django.urls import include, path

urlpatterns = [
    path("", include("core.urls")),
    path("users/", include("users.urls")),
]
