from django.urls import path

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
)

urlpatterns = [
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
    path("errors/", ErrorsView.as_view(), name="admin-errors"),
]
