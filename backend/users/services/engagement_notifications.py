from datetime import datetime, time, timedelta
import logging
from zoneinfo import ZoneInfo

from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from pywebpush import WebPushException
from requests.exceptions import RequestException

from core.models import Goal, LeagueEntry, Task
from core.services.league import TIERS, standings
from users.models import (
    NotificationDelivery, NotificationEvent, NotificationState, PushSubscription,
)
from users.services.push import send_push


CATEGORIES = {
    "welcome_back": "returnNotifications",
    "goal_nearly_complete": "goalNotifications",
    "goal_complete": "goalNotifications",
    "league_promotion_zone": "leagueRankNotifications",
    "weekly_review": "weeklyReviewNotifications",
    "daily_plan": "dailyPlanNotifications",
}
logger = logging.getLogger(__name__)


def quiet_now(preferences, local):
    if not preferences.get("quietHours", False):
        return False
    start = time.fromisoformat(preferences.get("quietStart", "22:00"))
    end = time.fromisoformat(preferences.get("quietEnd", "08:00"))
    clock = local.time().replace(tzinfo=None)
    return start <= clock < end if start <= end else clock >= start or clock < end


def goal_progress(goal):
    """Match the API's equally weighted milestone progress, without rounding."""
    milestones = list(goal.milestones.all())
    if not milestones:
        return 0
    progress = []
    for milestone in milestones:
        tasks = [task for task in milestone.tasks.all() if task.deleted_at is None]
        completed = sum(task.status == Task.Status.COMPLETED for task in tasks)
        progress.append(completed / len(tasks) if tasks else 0)
    return sum(progress) / len(progress)


def promotion_zone(entry, now):
    rows = standings(entry.group, now)
    active = sum(score > 0 for _, score, _ in rows)
    slots = max(1, active // 5) if active >= 5 else 0
    return entry.group.tier < len(TIERS) - 1 and any(
        row.pk == entry.pk and score > 0 and index < slots
        for index, (row, score, _) in enumerate(rows)
    )


def collect_events(user, local, now):
    preferences = user.preferences

    def emit(key, template, url, expires, body=""):
        NotificationEvent.objects.get_or_create(
            user=user, key=key,
            defaults={"template": template, "url": url, "expires_at": expires, "body": body},
        )

    with transaction.atomic():
        NotificationState.objects.get_or_create(user=user)
        state = NotificationState.objects.select_for_update().get(user=user)
        previous = state.snapshot
        snapshot = {"started_at": previous.get("started_at", now.isoformat())}
        last_seen = user.account_sessions.aggregate(value=Max("last_seen"))["value"]
        if last_seen and now - last_seen >= timedelta(days=3):
            if preferences.get("returnNotifications", False):
                emit(f"return:{last_seen.isoformat()}", "welcome_back", "/today", now + timedelta(days=1))

        goals = Goal.objects.filter(owner=user, is_archived=False).prefetch_related("milestones__tasks")
        snapshot["goals"] = {}
        for goal in goals:
            key = str(goal.pk)
            progress = goal_progress(goal)
            snapshot["goals"][key] = progress
            old = previous.get("goals", {}).get(key)
            if old is None and goal.created_at > datetime.fromisoformat(snapshot["started_at"]):
                old = 0
            if not preferences.get("goalNotifications", False) or old is None:
                continue
            # Each goal milestone notification is sent once, even after reopening tasks.
            if old < 1 and progress == 1:
                emit(f"goal-complete:{key}", "goal_complete", "/goals", now + timedelta(days=1))
            elif old < .8 <= progress < 1:
                emit(f"goal-near:{key}", "goal_nearly_complete", "/goals", now + timedelta(days=1))

        snapshot["zones"] = {}
        entries = LeagueEntry.objects.filter(
            membership__owner=user, membership__is_active=True,
            group__week__closed_at__isnull=True,
            group__week__start__lte=now,
            group__week__start__gt=now - timedelta(days=7),
        ).select_related("group__week")
        for entry in entries:
            key = str(entry.pk)
            inside = promotion_zone(entry, now)
            snapshot["zones"][key] = inside
            if (
                preferences.get("leagueRankNotifications", False)
                and previous.get("zones", {}).get(key) is False and inside
            ):
                emit(f"zone:{key}", "league_promotion_zone", "/league", entry.group.week.start + timedelta(days=7))

        weekday = preferences.get("weekStart", 1)
        # JS weekdays start on Sunday, Python's on Monday.
        start = local.date() - timedelta(days=(local.weekday() - (weekday - 1) % 7) % 7)
        if preferences.get("weeklyReviewNotifications", False) and local.date() == start and local.hour >= 9:
            end = datetime.combine(start, time.min, tzinfo=local.tzinfo)
            begin = datetime.combine(start - timedelta(days=7), time.min, tzinfo=local.tzinfo)
            count = Task.objects.filter(
                project__owner=user, deleted_at__isnull=True,
                status=Task.Status.COMPLETED, completed_at__gte=begin, completed_at__lt=end,
            ).count()
            if count:
                noun = "task" if count == 1 else "tasks"
                emit(f"weekly:{start}", "weekly_review", "/completed", end + timedelta(days=1),
                     f"You completed {count} {noun} last week. See your progress in BjeyFlow.")

        daily_time = time.fromisoformat(preferences.get("dailyPlanTime", "09:00"))
        due = datetime.combine(local.date(), daily_time, tzinfo=local.tzinfo)
        if preferences.get("dailyPlanNotifications", False) and due <= now < due + timedelta(hours=1):
            count = Task.objects.filter(
                project__owner=user, deleted_at__isnull=True, due_date=local.date(),
            ).exclude(status=Task.Status.COMPLETED).count()
            if count:
                noun = "task" if count == 1 else "tasks"
                emit(f"daily:{local.date()}", "daily_plan", "/today", due + timedelta(hours=1),
                     f"You have {count} unfinished {noun} due today. Choose where to start.")
        state.snapshot = snapshot
        state.save(update_fields=["snapshot"])


def send_engagement_notifications(now=None):
    now = now or timezone.now()
    subscriptions = PushSubscription.objects.filter(
        user__is_active=True, session__revoked_at__isnull=True,
    ).select_related("user").order_by("user_id", "created_at")
    seen = set()
    for subscription in subscriptions.iterator():
        user = subscription.user
        preferences = user.preferences
        if not preferences.get("browserNotifications", False):
            continue
        zone = preferences.get("timeZone", "system")
        local = now.astimezone(ZoneInfo(subscription.time_zone if zone == "system" else zone))
        if user.pk not in seen:
            collect_events(user, local, now)
            seen.add(user.pk)
        if quiet_now(preferences, local):
            continue
        events = NotificationEvent.objects.filter(
            user=user, expires_at__gt=now, created_at__gte=subscription.created_at,
        ).order_by("created_at")
        for event in events:
            if not preferences.get(CATEGORIES[event.template], False):
                continue
            # Don't send a stale return invitation after activity resumes.
            if event.template == "welcome_back" and user.account_sessions.filter(
                last_seen__gt=now - timedelta(days=3)
            ).exists():
                continue
            if event.template == "league_promotion_zone":
                entry = LeagueEntry.objects.filter(pk=event.key.split(":")[1]).select_related("group").first()
                if entry is None or not promotion_zone(entry, now):
                    continue
            if event.template in ("goal_complete", "goal_nearly_complete"):
                goal = Goal.objects.filter(
                    pk=event.key.split(":")[1], owner=user, is_archived=False,
                ).prefetch_related("milestones__tasks").first()
                progress = goal_progress(goal) if goal else 0
                if event.template == "goal_complete" and progress != 1:
                    continue
                if event.template == "goal_nearly_complete" and not .8 <= progress < 1:
                    continue
            if event.template == "daily_plan" and not Task.objects.filter(
                project__owner=user, deleted_at__isnull=True, due_date=local.date(),
            ).exclude(status=Task.Status.COMPLETED).exists():
                continue
            with transaction.atomic():
                delivery, created = NotificationDelivery.objects.get_or_create(event=event, subscription=subscription)
                if not created:
                    continue
                try:
                    delivered = send_push(
                        subscription, event.template, event.url,
                        ttl=min(3600, max(1, int((event.expires_at - now).total_seconds()))),
                        body=event.body or None,
                    )
                except (WebPushException, RequestException):
                    delivery.delete()
                    logger.warning("An engagement notification failed; it may be retried while current.")
                    continue
                if not delivered:
                    break
    # Keep event keys after expiry: pruning them could repeat the same absence or
    # achievement after a long interval. Expired events are never delivered.
