from django.urls import include, path
from rest_framework.routers import SimpleRouter

from users.views.auth import ChangePasswordView, LoginView, LogoutView, MeView
from users.views.management import UserManagementViewSet

router = SimpleRouter()
router.register(r"", UserManagementViewSet, basename="users")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
