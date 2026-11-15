import json
import logging

from django.conf import settings
from pywebpush import WebPushException, webpush
from requests import Session
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

TEMPLATES = {
    "task_reminder": {
        "name": "Task reminder",
        "description": "Sent before an unfinished task is due.",
        "title": "A task is due soon",
        "body": "Open BjeyFlow to view your upcoming task.",
    },
    "test": {
        "name": "Test notification",
        "description": "Sent only when a user requests a test on their device.",
        "title": "Notifications are ready",
        "body": "BjeyFlow can send reminders to this device.",
    },
    "focus_complete": {
        "name": "Focus complete",
        "description": "Shown by the browser when an open focus timer finishes.",
        "title": "Focus session complete",
        "body": "Nice work. Take a short break—you earned it.",
    },
}


def push_configured():
    return bool(
        settings.VAPID_PUBLIC_KEY
        and settings.VAPID_PRIVATE_KEY
        and settings.VAPID_SUBJECT
    )


def send_push(subscription, template, url, ttl=60):
    payload = {
        "title": TEMPLATES[template]["title"],
        "body": TEMPLATES[template]["body"],
        "url": url,
        "tag": f"{template}:{url}",
    }
    session = Session()
    session.max_redirects = 0
    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
            },
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
            ttl=ttl,
            timeout=10,
            requests_session=session,
        )
    except WebPushException as error:
        if error.response is not None and error.response.status_code in (404, 410):
            subscription.delete()
            return False
        logger.warning("Web push delivery failed: %s", type(error).__name__)
        raise
    except RequestException as error:
        logger.warning("Web push transport failed: %s", type(error).__name__)
        raise
    finally:
        session.close()
    return True
