import json
import logging

from django.conf import settings
from pywebpush import WebPushException, webpush
from requests import Session
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

TEMPLATES = {
    "welcome_back": {
        "name": "Time to return",
        "description": "Once after three days without activity, until you return.",
        "title": "Ready for a small step?",
        "body": "It's been a few days. Pick up where you left off whenever you're ready.",
        "image": "/images/notification-welcome-back.webp?v=1",
    },
    "goal_nearly_complete": {
        "name": "Goal almost complete",
        "description": "When an existing goal crosses 80% progress.",
        "title": "You're close to your goal",
        "body": "Your goal is at least 80% complete. See what's left to do.",
        "image": "/images/notification-goal-nearly-complete.webp?v=1",
    },
    "goal_complete": {
        "name": "Goal completed",
        "description": "When all milestones in an existing goal are completed.",
        "title": "You reached your goal!",
        "body": "Every milestone is complete. Take a moment to celebrate your work.",
        "image": "/images/notification-goal-complete.webp?v=1",
    },
    "league_promotion_zone": {
        "name": "Entered promotion zone",
        "description": "When you enter the promotion zone after previously being outside it.",
        "title": "You're in the promotion zone",
        "body": "You're currently on track to move up. Positions can still change.",
        "image": "/images/notification-league-promotion-zone.webp?v=1",
    },
    "weekly_review": {
        "name": "Weekly review",
        "description": "A weekly summary when you completed tasks in the previous week.",
        "title": "Your week in review",
        "body": "See the tasks you completed last week and plan your next steps.",
        "image": "/images/notification-weekly-review.webp?v=1",
    },
    "daily_plan": {
        "name": "Daily plan",
        "description": "At your chosen time, only when unfinished tasks are due today.",
        "title": "Here's your plan for today",
        "body": "You have tasks due today. Choose where you'd like to start.",
        "image": "/images/notification-daily-plan.webp?v=1",
    },
    "task_reminder": {
        "name": "Task reminder",
        "description": "Sent before an unfinished task is due.",
        "title": "A task is coming up",
        "body": "You have an upcoming task. Open BjeyFlow to see the details.",
        "image": "/images/notification-task-reminder.webp?v=1",
    },
    "test": {
        "name": "Test notification",
        "description": "Sent only when a user requests a test on their device.",
        "title": "Notifications are working",
        "body": "You're all set! This device can receive BjeyFlow reminders.",
        "image": "/images/notification-test.webp?v=1",
    },
    "focus_complete": {
        "name": "Focus complete",
        "description": "Shown by the browser when an open focus timer finishes.",
        "title": "Focus session complete",
        "body": "Nice work! It's time for a well-earned break.",
        "image": "/images/notification-focus-complete.webp?v=1",
    },
    "league_week_started": {
        "name": "League week started",
        "description": "Sent when a new league week begins.",
        "title": "A new league week has started",
        "body": "Your league is ready. See who's joining you this week.",
        "image": "/images/notification-league-week-started.webp?v=1",
    },
    "league_week_ending": {
        "name": "League week ending",
        "description": "Sent during the final day of the league week.",
        "title": "Your league week ends tomorrow",
        "body": "There's one day left. Check your position in the league.",
        "image": "/images/notification-league-week-ending.webp?v=1",
    },
    "league_promoted": {
        "name": "League promotion",
        "description": "Sent after a league promotion.",
        "title": "You've been promoted!",
        "body": "Great work! You've moved up to a higher league.",
        "image": "/images/notification-league-promoted.webp?v=1",
    },
    "league_demoted": {
        "name": "League result: new start",
        "description": "Sent when a league week ends with a demotion.",
        "title": "Your league has changed",
        "body": "You moved down a league this week. A fresh start is waiting.",
        "image": "/images/notification-league-demoted.webp?v=1",
    },
    "league_stay": {
        "name": "League weekly result",
        "description": "Sent when a league week ends without a tier change.",
        "title": "Your league results are in",
        "body": "You're staying in the same league. See how you did this week.",
        "image": "/images/notification-league-stay.webp?v=1",
    },
}


def push_configured():
    return bool(
        settings.VAPID_PUBLIC_KEY
        and settings.VAPID_PRIVATE_KEY
        and settings.VAPID_SUBJECT
    )


def send_push(subscription, template, url, ttl=60, *, body=None):
    payload = {
        "title": TEMPLATES[template]["title"],
        "body": body if body is not None else TEMPLATES[template]["body"],
        "url": url,
        "tag": f"{template}:{url}",
    }
    if image := TEMPLATES[template].get("image"):
        payload["image"] = image
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
