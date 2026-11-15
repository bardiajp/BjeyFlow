from django.urls import include, path
from django.http import HttpResponse

urlpatterns = [
    path("healthz/", lambda request: HttpResponse("ok"), name="health"),
    path("api/", include("core.urls")),
    path("api/admin/", include("administration.urls")),
    path("users/", include("users.urls")),
]
