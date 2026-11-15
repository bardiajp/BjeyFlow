from datetime import timedelta
from math import ceil

from django.db import transaction
from django.conf import settings
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.template.loader import render_to_string
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from core.models import Project, Task
from users.models import User
from users.permissions import HasAccountableRole, IsSystemAdministrator
from users.services.push import TEMPLATES
from .audit import record_event
from .health import service_status
from .models import AuditEvent, EmailEvent, SiteSettings, SystemEvent
from .serializers import (
    AuditEventSerializer,
    EmailEventSerializer,
    PublicSettingsSerializer,
    SiteSettingsSerializer,
    SystemEventSerializer,
)


class PublicSettingsView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = PublicSettingsSerializer

    def get_object(self):
        return SiteSettings.load()


class PushTemplatesView(APIView):
    permission_classes = [HasAccountableRole]

    def get(self, request):
        return Response([{"id": key, **value} for key, value in TEMPLATES.items()])


class OverviewView(APIView):
    permission_classes = [HasAccountableRole]

    def get(self, request):
        since = timezone.now() - timedelta(days=7)
        tasks = Task.objects.filter(deleted_at__isnull=True)
        return Response(
            {
                "counts": {
                    "users": User.objects.count(),
                    "active_accounts": User.objects.filter(is_active=True).count(),
                    "signed_in_last_week": User.objects.filter(
                        last_login__gte=since
                    ).count(),
                    "projects": Project.objects.count(),
                    "tasks": tasks.count(),
                    "completed_tasks": tasks.filter(
                        status=Task.Status.COMPLETED
                    ).count(),
                    "trashed_tasks": Task.objects.filter(
                        deleted_at__isnull=False
                    ).count(),
                    "failed_logins_last_week": AuditEvent.objects.filter(
                        action="login.failed", created_at__gte=since
                    ).count(),
                    "email_failures_last_week": EmailEvent.objects.filter(
                        status="failed", created_at__gte=since
                    ).count(),
                    "errors_last_week": SystemEvent.objects.filter(
                        created_at__gte=since
                    ).count(),
                },
                "registrations": list(
                    User.objects.filter(date_joined__gte=since)
                    .annotate(day=TruncDate("date_joined"))
                    .values("day")
                    .annotate(count=Count("id"))
                    .order_by("day")
                ),
                "task_statuses": list(
                    tasks.order_by().values("status").annotate(count=Count("id"))
                ),
            }
        )


class SiteSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = SiteSettingsSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_permissions(self):
        return (
            [HasAccountableRole()]
            if self.request.method in permissions.SAFE_METHODS
            else [IsSystemAdministrator()]
        )

    def get_object(self):
        return SiteSettings.load()

    @transaction.atomic
    def perform_update(self, serializer):
        serializer.instance = SiteSettings.objects.select_for_update().get(pk=1)
        serializer.save()
        record_event(
            "settings.updated",
            actor=self.request.user,
            request=self.request,
            metadata={"fields": sorted(serializer.validated_data)},
        )


class HealthThrottle(UserRateThrottle):
    scope = "admin_health"


class HealthView(APIView):
    permission_classes = [HasAccountableRole]
    throttle_classes = [HealthThrottle]

    def get(self, request):
        return Response(service_status())


class ActivityView(generics.ListAPIView):
    permission_classes = [HasAccountableRole]
    serializer_class = AuditEventSerializer
    queryset = AuditEvent.objects.all()
    filterset_fields = ["action", "actor_name"]
    search_fields = ["action", "actor_name", "target"]


class EmailsView(generics.ListAPIView):
    permission_classes = [HasAccountableRole]
    serializer_class = EmailEventSerializer
    queryset = EmailEvent.objects.all()
    filterset_fields = ["status", "kind"]
    search_fields = ["recipient", "kind", "error_type"]


class ErrorsView(generics.ListAPIView):
    permission_classes = [HasAccountableRole]
    serializer_class = SystemEventSerializer
    queryset = SystemEvent.objects.all()
    search_fields = ["source", "error_type"]


class EmailTemplatesView(APIView):
    permission_classes = [HasAccountableRole]

    def get(self, request):
        templates = [
            {
                "id": "verification",
                "name": "Verify your email",
                "subject": "Your BjeyFlow verification code",
                "description": "Sent when someone signs up or requests another verification code.",
                "context": {
                    "code": "482916",
                    "expiry_minutes": ceil(settings.SIGNUP_CODE_LIFETIME_SECONDS / 60),
                },
            },
            {
                "id": "password_reset",
                "name": "Reset your password",
                "subject": "A fresh start for your BjeyFlow password",
                "description": "Sent for password recovery and administrator-requested reset links.",
                "context": {
                    "reset_url": "https://example.invalid/reset-password#uid=00000000-0000-0000-0000-000000000000&token=preview-only",
                    "expiry_minutes": ceil(settings.PASSWORD_RESET_TIMEOUT / 60),
                },
            },
        ]
        return Response(
            [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "subject": item["subject"],
                    "description": item["description"],
                    "html": render_to_string(
                        f"users/emails/{item['id']}.html", item["context"]
                    ),
                    "text": render_to_string(
                        f"users/emails/{item['id']}.txt", item["context"]
                    ),
                }
                for item in templates
            ]
        )
