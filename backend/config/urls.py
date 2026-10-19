from django.urls import include, path

urlpatterns = [
    path("api/", include("core.urls")),
    path("users/", include("users.urls")),
]
