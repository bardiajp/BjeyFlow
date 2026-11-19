import uuid

from django.conf import settings
from django.db import models


class PushSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )
    session = models.ForeignKey(
        "users.AccountSession",
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )
    endpoint = models.URLField(max_length=2048, unique=True)
    p256dh = models.CharField(max_length=128)
    auth = models.CharField(max_length=128)
    time_zone = models.CharField(max_length=100)
    user_agent = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class PushDelivery(models.Model):
    subscription = models.ForeignKey(PushSubscription, on_delete=models.CASCADE)
    task = models.ForeignKey("core.Task", on_delete=models.CASCADE)
    due_at = models.DateTimeField()
    reminder_minutes = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["subscription", "task", "due_at", "reminder_minutes"],
                name="push_delivery_unique",
            )
        ]


class LeaguePushDelivery(models.Model):
    subscription = models.ForeignKey(PushSubscription, on_delete=models.CASCADE)
    entry = models.ForeignKey("core.LeagueEntry", on_delete=models.CASCADE)
    kind = models.CharField(max_length=24)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["subscription", "entry", "kind"], name="league_push_delivery_unique"
            )
        ]


class NotificationState(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    snapshot = models.JSONField(default=dict)


class NotificationEvent(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    key = models.CharField(max_length=200)
    template = models.CharField(max_length=40)
    url = models.CharField(max_length=255)
    body = models.CharField(max_length=255, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "key"], name="notification_event_unique")
        ]


class NotificationDelivery(models.Model):
    event = models.ForeignKey(NotificationEvent, on_delete=models.CASCADE)
    subscription = models.ForeignKey(PushSubscription, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "subscription"], name="notification_delivery_unique"
            )
        ]
