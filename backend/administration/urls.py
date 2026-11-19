from django.urls import path
from .recommendations import AdminRecommendationsView

from .views import (
    EmailTemplatesView,
    ActivityView,
    EmailsView,
    ErrorsView,
    HealthView,
    OverviewView,
    PublicSettingsView,
    SiteSettingsView,
    PushTemplatesView,
    PendingSignupsView,
    ApproveSignupView,
)

urlpatterns = [
    path("recommendations/", AdminRecommendationsView.as_view(), name="admin-recommendations"),
    path(
        "notification-templates/",
        PushTemplatesView.as_view(),
        name="admin-notification-templates",
    ),
    path(
        "email-templates/", EmailTemplatesView.as_view(), name="admin-email-templates"
    ),
    path("public-settings/", PublicSettingsView.as_view(), name="public-settings"),
    path("overview/", OverviewView.as_view(), name="admin-overview"),
    path("settings/", SiteSettingsView.as_view(), name="admin-settings"),
    path("health/", HealthView.as_view(), name="admin-health"),
    path("activity/", ActivityView.as_view(), name="admin-activity"),
    path("emails/", EmailsView.as_view(), name="admin-emails"),
    path("pending-signups/", PendingSignupsView.as_view(), name="admin-pending-signups"),
    path("pending-signups/<uuid:pk>/approve/", ApproveSignupView.as_view(), name="admin-approve-signup"),
    path("errors/", ErrorsView.as_view(), name="admin-errors"),
]
