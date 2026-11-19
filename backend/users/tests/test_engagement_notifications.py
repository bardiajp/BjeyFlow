from datetime import datetime, timedelta, timezone as utc
from unittest.mock import patch
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.test import TestCase, SimpleTestCase
from django.utils import timezone

from core.models import Goal, Milestone, Project, Task, LeagueEntry, LeagueGroup, LeagueMembership, LeagueWeek
from requests.exceptions import RequestException
from users.models import AccountSession, NotificationDelivery, NotificationEvent, PushSubscription
from users.serializers.settings import PreferencesSerializer
from users.services.engagement_notifications import (
    collect_events, quiet_now, send_engagement_notifications,
)


class NotificationPreferenceTests(SimpleTestCase):
    def test_new_preferences_validate_and_time_rejects_invalid_input(self):
        serializer = PreferencesSerializer(data={"returnNotifications": True, "dailyPlanTime": "08:30"}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer = PreferencesSerializer(data={"dailyPlanTime": "25:00"}, partial=True)
        self.assertFalse(serializer.is_valid())

    def test_quiet_hours_cross_midnight_and_equal_hours(self):
        local = datetime(2026, 11, 19, 23, tzinfo=ZoneInfo("UTC"))
        self.assertTrue(quiet_now({"quietHours": True}, local))
        self.assertFalse(quiet_now({"quietHours": True, "quietStart": "22:00", "quietEnd": "22:00"}, local))


class EngagementNotificationTests(TestCase):
    def setUp(self):
        self.now = timezone.now().replace(hour=9, minute=15, second=0, microsecond=0)
        self.user = get_user_model().objects.create_user(
            username="notification-test",
            preferences={
                "browserNotifications": True, "timeZone": "UTC",
                "returnNotifications": True, "goalNotifications": True,
                "dailyPlanNotifications": True, "dailyPlanTime": "09:00",
                "weeklyReviewNotifications": True,
                "weekStart": (self.now.weekday() + 1) % 7,
            },
        )
        self.session = AccountSession.objects.create(
            user=self.user, token_id="notification-test", expires_at=self.now + timedelta(days=30),
        )
        AccountSession.objects.filter(pk=self.session.pk).update(last_seen=self.now - timedelta(days=4))
        self.subscription = PushSubscription.objects.create(
            user=self.user, session=self.session,
            endpoint="https://fcm.googleapis.com/test", p256dh="key", auth="key", time_zone="UTC",
        )
        # Delivery must not replay events from before device registration.
        PushSubscription.objects.filter(pk=self.subscription.pk).update(created_at=self.now - timedelta(days=1))
        self.project = Project.objects.create(owner=self.user, name="Notifications", key="NT")

    def collect(self):
        collect_events(self.user, self.now.astimezone(utc.utc), self.now)

    def test_return_is_once_per_absence_and_uses_all_sessions(self):
        self.collect()
        self.collect()
        self.assertEqual(NotificationEvent.objects.filter(template="welcome_back").count(), 1)
        AccountSession.objects.filter(pk=self.session.pk).update(last_seen=self.now)
        self.collect()
        AccountSession.objects.filter(pk=self.session.pk).update(last_seen=self.now - timedelta(days=3, minutes=1))
        self.collect()
        self.assertEqual(NotificationEvent.objects.filter(template="welcome_back").count(), 2)

    def test_goal_crossing_and_completion_not_historical_or_repeated(self):
        goal = Goal.objects.create(owner=self.user, title="Private goal")
        milestone = Milestone.objects.create(goal=goal, title="Milestone")
        tasks = [Task.objects.create(project=self.project, milestone=milestone, title="Private task") for _ in range(5)]
        self.collect()
        Task.objects.filter(pk__in=[task.pk for task in tasks[:4]]).update(status="completed", completed_at=self.now)
        self.collect()
        self.assertEqual(NotificationEvent.objects.filter(template="goal_nearly_complete").count(), 1)
        Task.objects.filter(pk=tasks[4].pk).update(status="completed", completed_at=self.now)
        self.collect()
        self.collect()
        self.assertEqual(NotificationEvent.objects.filter(template="goal_complete").count(), 1)
        for event in NotificationEvent.objects.all():
            self.assertNotIn("Private", event.body)

    def test_daily_plan_requires_unfinished_due_tasks_and_runs_once(self):
        self.collect()
        self.assertFalse(NotificationEvent.objects.filter(template="daily_plan").exists())
        Task.objects.create(project=self.project, title="Today", due_date=self.now.date())
        self.collect()
        self.collect()
        event = NotificationEvent.objects.get(template="daily_plan")
        self.assertIn("1 unfinished task", event.body)

    def test_weekly_review_counts_only_previous_week(self):
        Task.objects.create(project=self.project, title="Done", status="completed", completed_at=self.now - timedelta(days=2))
        Task.objects.create(project=self.project, title="Today", status="completed", completed_at=self.now)
        self.collect()
        self.assertIn("1 task last week", NotificationEvent.objects.get(template="weekly_review").body)

    @patch("users.services.engagement_notifications.promotion_zone")
    def test_rank_notifies_only_on_crossing_and_once_per_week(self, zone):
        self.user.preferences["leagueRankNotifications"] = True
        membership = LeagueMembership.objects.create(owner=self.user, public_name="Test")
        week = LeagueWeek.objects.create(start=self.now - timedelta(days=1))
        group = LeagueGroup.objects.create(week=week, tier=0)
        LeagueEntry.objects.create(group=group, membership=membership, eligible_from=week.start)
        zone.return_value = True
        self.collect()
        self.assertFalse(NotificationEvent.objects.filter(template="league_promotion_zone").exists())
        zone.return_value = False
        self.collect()
        zone.return_value = True
        self.collect()
        self.collect()
        self.assertEqual(NotificationEvent.objects.filter(template="league_promotion_zone").count(), 1)

    @patch("users.services.engagement_notifications.send_push")
    def test_transport_failure_is_retried(self, send):
        send.side_effect = RequestException("Network unavailable")
        send_engagement_notifications(self.now)
        self.assertEqual(NotificationDelivery.objects.count(), 0)
        send.side_effect = None
        send.return_value = True
        send_engagement_notifications(self.now)
        self.assertEqual(NotificationDelivery.objects.count(), 1)

    @patch("users.services.engagement_notifications.send_push", return_value=True)
    def test_return_event_is_not_sent_after_user_returns(self, send):
        self.collect()
        AccountSession.objects.filter(pk=self.session.pk).update(last_seen=self.now)
        send_engagement_notifications(self.now)
        send.assert_not_called()

    @patch("users.services.engagement_notifications.send_push", return_value=True)
    def test_optional_categories_are_off_by_default(self, send):
        self.user.preferences = {"browserNotifications": True}
        self.user.save()
        send_engagement_notifications(self.now)
        send.assert_not_called()

    @patch("users.services.engagement_notifications.send_push", return_value=True)
    def test_delivery_deduplicated_and_quiet_hours_respected(self, send):
        self.user.preferences["quietHours"] = True
        self.user.preferences["quietStart"] = "08:00"
        self.user.preferences["quietEnd"] = "10:00"
        self.user.save()
        send_engagement_notifications(self.now)
        send.assert_not_called()
        self.user.preferences["quietHours"] = False
        self.user.save()
        send_engagement_notifications(self.now)
        send_engagement_notifications(self.now)
        self.assertEqual(send.call_count, 1)
        self.assertEqual(NotificationDelivery.objects.count(), 1)

    @patch("users.services.engagement_notifications.send_push", return_value=True)
    def test_revoked_session_and_disabled_preferences_do_not_send(self, send):
        AccountSession.objects.filter(pk=self.session.pk).update(revoked_at=self.now)
        send_engagement_notifications(self.now)
        send.assert_not_called()
