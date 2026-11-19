from django.core.management.base import BaseCommand

from users.services.engagement_notifications import send_engagement_notifications
from users.services.push import push_configured


class Command(BaseCommand):
    help = "Send opted-in return, goal, league rank, weekly and daily notifications."

    def handle(self, *args, **options):
        if not push_configured():
            self.stdout.write("Push is not configured; no engagement notifications sent.")
            return
        send_engagement_notifications()
