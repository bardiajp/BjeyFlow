from datetime import time, timedelta
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from pywebpush import WebPushException
from requests.exceptions import RequestException

from core.models import LeagueEntry
from users.models import LeaguePushDelivery, PushSubscription
from users.services.push import push_configured, send_push


class Command(BaseCommand):
    help = "Send league notifications to opted-in devices."

    def handle(self, *args, **options):
        if not push_configured():
            self.stdout.write("Push is not configured; no league notifications sent.")
            return

        now = timezone.now()
        subscriptions = PushSubscription.objects.filter(
            user__is_active=True,
            session__revoked_at__isnull=True,
            session__expires_at__gt=now,
            user__league_membership__is_active=True,
        ).select_related("user", "user__league_membership")
        for subscription in subscriptions.iterator():
            preferences = subscription.user.preferences
            if not preferences.get("browserNotifications", False):
                continue
            zone_name = preferences.get("timeZone", "system")
            zone = ZoneInfo(subscription.time_zone if zone_name == "system" else zone_name)
            clock = now.astimezone(zone).time().replace(tzinfo=None)
            start = time.fromisoformat(preferences.get("quietStart", "22:00"))
            end = time.fromisoformat(preferences.get("quietEnd", "08:00"))
            quiet = preferences.get("quietHours", False) and (
                start <= clock < end if start <= end else clock >= start or clock < end
            )
            if quiet:
                continue
            entries = LeagueEntry.objects.filter(
                membership=subscription.user.league_membership,
                group__week__start__gte=now - timedelta(days=9),
                group__week__start__lte=now,
            ).select_related("group__week")
            for entry in entries:
                week_start = entry.group.week.start
                week_end = week_start + timedelta(days=7)
                templates = []
                if entry.group.week.closed_at and entry.outcome and week_end <= now < week_end + timedelta(days=2):
                    templates.append(("result", f"league_{entry.outcome}"))
                if week_start <= now < week_start + timedelta(days=1):
                    templates.append(("started", "league_week_started"))
                if week_end - timedelta(days=1) <= now < week_end and not entry.group.week.closed_at:
                    templates.append(("ending", "league_week_ending"))
                for kind, template in templates:
                    with transaction.atomic():
                        delivery, created = LeaguePushDelivery.objects.get_or_create(
                            subscription=subscription, entry=entry, kind=kind
                        )
                        if not created:
                            continue
                        try:
                            delivered = send_push(subscription, template, "/league", ttl=3600)
                        except (WebPushException, RequestException):
                            delivery.delete()
                            self.stderr.write("A league push failed; it may be retried while current.")
                            continue
                        if not delivered:
                            break
                if subscription.pk is None:
                    break
