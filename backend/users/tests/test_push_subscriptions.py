from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from users.models import AccountSession, PushSubscription
from core.models import Project, Task, LeagueMembership, LeagueWeek, LeagueGroup, LeagueEntry


class PushSubscriptionTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.now = timezone.now()
        self.user = get_user_model().objects.create_user(username="push-test")
        self.old = AccountSession.objects.create(
            user=self.user, token_id="old", expires_at=self.now - timedelta(hours=1),
        )
        self.current = AccountSession.objects.create(
            user=self.user, token_id="current", expires_at=self.now + timedelta(hours=1),
        )
        self.subscription = PushSubscription.objects.create(
            user=self.user, session=self.old, endpoint="https://fcm.googleapis.com/test",
            p256dh="key", auth="key", time_zone="UTC",
        )
        self.client.force_authenticate(self.user, token={"jti": "current"})

    def test_natural_login_expiry_does_not_hide_registered_device(self):
        response = self.client.get("/users/auth/push/subscriptions/")
        self.assertEqual(response.data, [self.subscription.endpoint])

    def test_rebinds_existing_device_to_current_login(self):
        response = self.client.patch(
            "/users/auth/push/subscriptions/", {"endpoint": self.subscription.endpoint}, format="json",
        )
        self.assertEqual(response.status_code, 204)
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.session, self.current)

    def test_revoked_device_is_not_silently_restored(self):
        self.old.revoked_at = self.now
        self.old.save()
        self.assertEqual(self.client.get("/users/auth/push/subscriptions/").data, [])
        response = self.client.patch(
            "/users/auth/push/subscriptions/", {"endpoint": self.subscription.endpoint}, format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_sync_never_reassigns_another_accounts_subscription(self):
        other = get_user_model().objects.create_user(username="other-push")
        self.client.force_authenticate(other, token={"jti": "other"})
        response = self.client.patch(
            "/users/auth/push/subscriptions/", {"endpoint": self.subscription.endpoint}, format="json",
        )
        self.assertEqual(response.status_code, 404)
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.user, self.user)

    def test_get_requests_do_not_consume_manual_enable_or_test_limit(self):
        for _ in range(25):
            self.assertEqual(self.client.get("/users/auth/push/subscriptions/").status_code, 200)
        self.assertEqual(self.client.delete(
            "/users/auth/push/subscriptions/", {"endpoint": self.subscription.endpoint}, format="json",
        ).status_code, 204)

    @patch("users.views.push.push_configured", return_value=True)
    @patch("users.views.push.send_push", return_value=True)
    def test_test_notification_still_works_after_login_expiry(self, send, configured):
        response = self.client.post(
            "/users/auth/push/test/", {"endpoint": self.subscription.endpoint}, format="json",
        )
        self.assertEqual(response.status_code, 200)
        send.assert_called_once()

    def test_rebinding_makes_current_logout_stop_this_device(self):
        self.client.patch(
            "/users/auth/push/subscriptions/", {"endpoint": self.subscription.endpoint}, format="json",
        )
        self.client.post("/users/auth/logout/")
        self.assertEqual(self.client.get("/users/auth/push/subscriptions/").data, [])

    def test_expired_push_device_remains_visible_in_session_management(self):
        response = self.client.get("/users/auth/sessions/")
        self.assertIn(str(self.old.pk), [str(row["id"]) for row in response.data])

    @patch("core.management.commands.send_push_reminders.push_configured", return_value=True)
    @patch("core.management.commands.send_push_reminders.send_push", return_value=True)
    def test_task_worker_delivers_after_natural_login_expiry(self, send, configured):
        self.user.preferences = {"browserNotifications": True}
        self.user.save()
        project = Project.objects.create(owner=self.user, name="Push project", key="PS")
        due = self.now + timedelta(minutes=15)
        Task.objects.create(project=project, title="Upcoming", due_date=due.date(), due_time=due.time())
        with patch("core.management.commands.send_push_reminders.timezone.now", return_value=self.now):
            call_command("send_push_reminders")
        send.assert_called_once()

    @patch("core.management.commands.send_league_notifications.push_configured", return_value=True)
    @patch("core.management.commands.send_league_notifications.send_push", return_value=True)
    def test_league_worker_delivers_after_natural_login_expiry(self, send, configured):
        self.user.preferences = {"browserNotifications": True}
        self.user.save()
        membership = LeagueMembership.objects.create(owner=self.user, public_name="Push test")
        week = LeagueWeek.objects.create(start=self.now - timedelta(hours=1))
        group = LeagueGroup.objects.create(week=week, tier=0)
        LeagueEntry.objects.create(group=group, membership=membership, eligible_from=week.start)
        with patch("core.management.commands.send_league_notifications.timezone.now", return_value=self.now):
            call_command("send_league_notifications")
        send.assert_called_once()
