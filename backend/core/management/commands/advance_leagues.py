from django.core.management.base import BaseCommand

from core.services.league import advance_leagues


class Command(BaseCommand):
    help = "Close completed league weeks and create the current week."

    def handle(self, *args, **options):
        week = advance_leagues()
        self.stdout.write(f"Current league week: {week.start.isoformat()}")
