from django.urls import include, path
from rest_framework.routers import SimpleRouter

from users.views.auth import ChangePasswordView, LoginView, LogoutView, MeView
from users.views.management import UserManagementViewSet
from users.views.settings import PreferencesView, ProfileView, SessionsView, UsernameView
from users.views.push import PushConfigView, PushSubscriptionsView, PushTestView
from users.views.signup import SignupResendView, SignupVerifyView, SignupView
from administration.recommendations import SubmitRecommendationView
from users.views.password_reset import (
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

router = SimpleRouter()
router.register(r"", UserManagementViewSet, basename="users")

urlpatterns = [
    path("auth/recommendations/", SubmitRecommendationView.as_view(), name="submit-recommendation"),
    path("auth/push/config/", PushConfigView.as_view(), name="push-config"),
    path(
        "auth/push/subscriptions/",
        PushSubscriptionsView.as_view(),
        name="push-subscriptions",
    ),
    path("auth/push/test/", PushTestView.as_view(), name="push-test"),
    path("auth/profile/", ProfileView.as_view(), name="profile"),
    path("auth/username/", UsernameView.as_view(), name="username"),
    path("auth/preferences/", PreferencesView.as_view(), name="preferences"),
    path("auth/sessions/", SessionsView.as_view(), name="sessions"),
    path(
        "auth/sessions/<uuid:session_id>/",
        SessionsView.as_view(),
        name="session-detail",
    ),
    path(
        "auth/password-reset/",
        PasswordResetRequestView.as_view(),
        name="password-reset",
    ),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/signup/verify/", SignupVerifyView.as_view(), name="signup-verify"),
    path("auth/signup/resend/", SignupResendView.as_view(), name="signup-resend"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
