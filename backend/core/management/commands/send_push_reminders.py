from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from pywebpush import WebPushException
from requests.exceptions import RequestException

from core.models import Task
from users.models import PushDelivery, PushSubscription
from users.services.push import push_configured, send_push


class Command(BaseCommand):
    help = "Send due task reminders to registered devices."

    def handle(self, *args, **options):
        if not push_configured():
            self.stdout.write("Push is not configured; no reminders sent.")
            return
        now = timezone.now()
        subscriptions = PushSubscription.objects.filter(
            user__is_active=True,
            session__revoked_at__isnull=True,
        ).select_related("user")
        for subscription in subscriptions.iterator():
            preferences = subscription.user.preferences
            if not preferences.get("browserNotifications", False):
                continue
            zone_name = preferences.get("timeZone", "system")
            zone = ZoneInfo(
                subscription.time_zone if zone_name == "system" else zone_name
            )
            local_now = now.astimezone(zone)
            lead = preferences.get("reminderMinutes", 15)
            target_day = (local_now + timedelta(minutes=lead)).date()
            tasks = Task.objects.filter(
                project__owner=subscription.user,
                deleted_at__isnull=True,
                due_date__range=(
                    target_day - timedelta(days=1),
                    target_day + timedelta(days=1),
                ),
            ).exclude(status=Task.Status.COMPLETED)
            for task in tasks.iterator():
                with transaction.atomic():
                    task = (
                        Task.objects.select_for_update()
                        .select_related("project")
                        .get(pk=task.pk)
                    )
                    if (
                        task.deleted_at
                        or task.status == Task.Status.COMPLETED
                        or not task.due_date
                    ):
                        continue
                    due = datetime.combine(
                        task.due_date, task.due_time or time(9), tzinfo=zone
                    )
                    reminder = due - timedelta(minutes=lead)
                    if not reminder <= now <= reminder + timedelta(seconds=90):
                        continue
                    clock = local_now.time().replace(tzinfo=None)
                    start = time.fromisoformat(preferences.get("quietStart", "22:00"))
                    end = time.fromisoformat(preferences.get("quietEnd", "08:00"))
                    quiet = preferences.get("quietHours", False) and (
                        start <= clock < end
                        if start <= end
                        else clock >= start or clock < end
                    )
                    delivery, created = PushDelivery.objects.get_or_create(
                        subscription=subscription,
                        task=task,
                        due_at=due,
                        reminder_minutes=lead,
                    )
                    if not created or quiet:
                        continue
                    try:
                        delivered = send_push(
                            subscription,
                            "task_reminder",
                            f"/today?task={task.pk}",
                            ttl=90,
                        )
                        if not delivered:
                            break
                    except (WebPushException, RequestException):
                        delivery.delete()
                        self.stderr.write(
                            "A push delivery failed; it may be retried while still current."
                        )
        PushDelivery.objects.filter(created_at__lt=now - timedelta(days=30)).delete()
