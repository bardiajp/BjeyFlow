from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from administration.audit import record_event
from administration.models import SiteSettings
from core.models import Task


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true")

    def handle(self, *args, **options):
        days = SiteSettings.load().trash_retention_days
        if days == 0:
            self.stdout.write("Automatic Trash cleanup is disabled.")
            return
        queryset = Task.objects.filter(
            deleted_at__lt=timezone.now() - timedelta(days=days)
        )
        count = queryset.count()
        if options["apply"]:
            with transaction.atomic():
                ids = list(
                    queryset.select_for_update()
                    .order_by("pk")
                    .values_list("pk", flat=True)
                )
                count = len(ids)
                Task.objects.filter(pk__in=ids).delete()
                record_event(
                    "trash.retention_cleanup",
                    metadata={"tasks": count, "retention_days": days},
                )
        self.stdout.write(
            f"{'Removed' if options['apply'] else 'Would remove'} {count} trashed tasks."
        )
