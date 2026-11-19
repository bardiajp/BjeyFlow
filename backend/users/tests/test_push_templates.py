import json
from pathlib import Path
from urllib.parse import urlsplit
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from users.services.push import TEMPLATES, send_push


class PushTemplateTests(SimpleTestCase):
    def test_all_template_images_exist(self):
        public = Path(__file__).resolve().parents[3] / "frontend" / "public"
        for template in TEMPLATES.values():
            with self.subTest(template=template["name"]):
                self.assertTrue((public / urlsplit(template["image"]).path.lstrip("/")).is_file())
                path = urlsplit(template["image"]).path.lstrip("/")
                self.assertTrue((public / path.replace(".webp", "-light.webp")).is_file())

    @override_settings(VAPID_PRIVATE_KEY="private", VAPID_SUBJECT="mailto:test@example.com")
    @patch("users.services.push.webpush")
    def test_reminder_payload_uses_private_friendly_template_and_task_link(self, webpush):
        subscription = SimpleNamespace(
            endpoint="https://fcm.googleapis.com/test", p256dh="key", auth="secret"
        )

        self.assertTrue(send_push(subscription, "task_reminder", "/today?task=123", ttl=90))

        payload = json.loads(webpush.call_args.kwargs["data"])
        self.assertEqual(payload["title"], TEMPLATES["task_reminder"]["title"])
        self.assertEqual(payload["body"], TEMPLATES["task_reminder"]["body"])
        self.assertEqual(payload["url"], "/today?task=123")
        self.assertEqual(payload["image"], "/images/notification-task-reminder.webp?v=1")
        self.assertEqual(webpush.call_args.kwargs["ttl"], 90)

    def test_focus_preview_copy(self):
        self.assertEqual(TEMPLATES["focus_complete"]["title"], "Focus session complete")
        self.assertEqual(
            TEMPLATES["focus_complete"]["body"],
            "Nice work! It's time for a well-earned break.",
        )
