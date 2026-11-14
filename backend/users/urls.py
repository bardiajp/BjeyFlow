from django.urls import include, path
from rest_framework.routers import SimpleRouter

from users.views.auth import ChangePasswordView, LoginView, LogoutView, MeView
from users.views.management import UserManagementViewSet
from users.views.signup import SignupResendView, SignupVerifyView, SignupView

router = SimpleRouter()
router.register(r"", UserManagementViewSet, basename="users")

urlpatterns = [
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/signup/verify/", SignupVerifyView.as_view(), name="signup-verify"),
    path("auth/signup/resend/", SignupResendView.as_view(), name="signup-resend"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
