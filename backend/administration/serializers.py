from rest_framework import serializers

from .models import AuditEvent, EmailEvent, SiteSettings, SystemEvent


class PublicSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = (
            "app_name",
            "support_email",
            "signup_enabled",
            "announcement",
            "maintenance_notice",
        )


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = (
            "app_name",
            "support_email",
            "signup_enabled",
            "announcement",
            "maintenance_notice",
            "trash_retention_days",
            "updated_at",
        )
        read_only_fields = ("updated_at",)


class AuditEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = (
            "id",
            "actor_name",
            "action",
            "target",
            "ip_address",
            "metadata",
            "created_at",
        )


class EmailEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailEvent
        fields = (
            "id",
            "kind",
            "recipient",
            "status",
            "backend",
            "error_type",
            "created_at",
        )


class SystemEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemEvent
        fields = ("id", "source", "error_type", "created_at")
