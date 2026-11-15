from django.conf import settings
from django.core.validators import MaxValueValidator
from django.db import models


class SiteSettings(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    app_name = models.CharField(max_length=60, default="BjeyFlow")
    support_email = models.EmailField(blank=True)
    signup_enabled = models.BooleanField(default=True)
    announcement = models.CharField(max_length=500, blank=True)
    maintenance_notice = models.CharField(max_length=500, blank=True)
    trash_retention_days = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(365)]
    )
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def load(cls):
        return cls.objects.get(pk=1)


class AuditEvent(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    actor_name = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=80, db_index=True)
    target = models.CharField(max_length=150, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class EmailEvent(models.Model):
    kind = models.CharField(max_length=40)
    recipient = models.EmailField()
    status = models.CharField(
        max_length=20,
        choices=[("accepted", "Accepted by backend"), ("failed", "Failed")],
    )
    backend = models.CharField(max_length=150)
    error_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class SystemEvent(models.Model):
    source = models.CharField(max_length=150)
    error_type = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
