import os
import secrets
from datetime import time, timedelta
from uuid import NAMESPACE_URL, uuid5

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.models import Project, SubTask, Task


PROJECTS = (
    ("website", "Website refresh", "A fresh, thoughtful home for our work.", "#8ECAE6"),
    (
        "product",
        "Product studio",
        "Ideas, feedback, and the next iteration.",
        "#FB8500",
    ),
    ("personal", "Personal", "Make room for the things outside work.", "#90BE6D"),
    ("reading", "Reading list", "A little learning every day.", "#B8A1D9"),
)

# New deadlines are relative to the run date. Checklist tuples are (title, done).
TASKS = (
    {
        "key": "homepage-review",
        "project": "website",
        "title": "Review homepage explorations",
        "day": 0,
        "time": time(10),
        "priority": Task.Priority.HIGH,
        "subtasks": (
            ("Review layout", True),
            ("Check typography", True),
            ("Check colors", True),
            ("Review mobile version", False),
            ("Send feedback", False),
        ),
    },
    {
        "key": "onboarding-feedback",
        "project": "product",
        "title": "Send feedback on the onboarding flow",
        "day": 0,
        "subtasks": (("Walk through the flow", True), ("Write feedback", False)),
    },
    {
        "key": "design-sync-notes",
        "project": "product",
        "title": "Prepare notes for the design sync",
        "day": 0,
        "time": time(14),
        "priority": Task.Priority.HIGH,
    },
    {
        "key": "dinner-reservation",
        "project": "personal",
        "title": "Book a table for Friday dinner",
        "day": 0,
        "time": time(18),
    },
    {
        "key": "creative-act",
        "project": "reading",
        "title": "Read a chapter of The Creative Act",
        "day": 0,
        "priority": Task.Priority.LOW,
    },
    {
        "key": "brand-references",
        "project": "website",
        "title": "Organize references for the brand workshop",
        "day": 0,
        "subtasks": (
            ("Collect references", True),
            ("Group by theme", False),
            ("Prepare the mood board", False),
        ),
    },
    {
        "key": "weekly-priorities",
        "project": "personal",
        "title": "Plan the week's priorities",
        "day": 0,
        "status": Task.Status.COMPLETED,
    },
    {
        "key": "project-timeline",
        "project": "website",
        "title": "Share the updated project timeline",
        "day": 0,
        "status": Task.Status.COMPLETED,
    },
    {
        "key": "kickoff",
        "project": "website",
        "title": "Prepare the project kickoff",
        "day": 1,
        "time": time(9, 30),
        "priority": Task.Priority.HIGH,
        "subtasks": (("Write the agenda", False), ("Confirm the participants", False)),
    },
    {
        "key": "groceries",
        "project": "personal",
        "title": "Pick up groceries",
        "day": 1,
        "priority": Task.Priority.LOW,
    },
    {
        "key": "usability-session",
        "project": "product",
        "title": "Run a usability session",
        "day": 2,
        "time": time(11),
        "priority": Task.Priority.URGENT,
    },
    {
        "key": "wireframes",
        "project": "website",
        "title": "Revise the mobile wireframes",
        "day": 3,
        "status": Task.Status.IN_PROGRESS,
    },
    {
        "key": "next-book",
        "project": "reading",
        "title": "Choose the next book",
        "day": 7,
        "priority": Task.Priority.LOW,
    },
    {
        "key": "bill",
        "project": "personal",
        "title": "Pay the internet bill",
        "day": -1,
        "priority": Task.Priority.HIGH,
    },
    {
        "key": "reading-notes",
        "project": "reading",
        "title": "Organize reading notes",
        "day": None,
    },
    {
        "key": "finished-chapter",
        "project": "reading",
        "title": "Finish the opening chapter",
        "day": -2,
        "status": Task.Status.COMPLETED,
    },
)


class Command(BaseCommand):
    help = "Create development demo projects, tasks, and subtasks without overwriting existing data."
    requires_migrations_checks = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default=os.environ.get("SEED_USERNAME") or "demo",
            help="Demo account username (defaults to SEED_USERNAME or demo).",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Seed data is only available with DEBUG=True.")

        username = get_user_model().normalize_username(options["username"].strip())
        if not username or len(username) > 150:
            raise CommandError("The seed username must contain 1–150 characters.")
        result = self.seed(username)
        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete for {username}: created {result['projects']} projects, "
                f"{result['tasks']} tasks, and {result['subtasks']} subtasks."
            )
        )
        if result["user_created"]:
            self.stdout.write(f"Demo login: {username}")
            if result["generated_password"]:
                self.stdout.write(f"Demo password: {result['generated_password']}")
                self.stdout.write(
                    "Keep this password safe; it will not be printed again."
                )
            else:
                self.stdout.write("Demo password: configured through SEED_PASSWORD.")
        else:
            self.stdout.write(
                "Existing account, password, and records were left unchanged."
            )
        if result["skipped"]:
            self.stdout.write(
                f"Skipped {result['skipped']} missing tasks in archived projects."
            )

    @transaction.atomic
    def seed(self, username):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "display_name": "Alex Lee",
                "first_name": "Alex",
                "last_name": "Lee",
            },
        )
        user_created = created
        generated_password = None
        if created:
            configured_password = os.environ.get("SEED_PASSWORD")
            password = configured_password or secrets.token_urlsafe(18)
            if not configured_password:
                generated_password = password
            if len(password) < 8:
                raise CommandError("SEED_PASSWORD must be at least 8 characters long.")
            user.set_password(password)
            user.save(update_fields=["password"])
        elif not user.is_active:
            raise CommandError(
                "The seed account is inactive; it will not be reactivated automatically."
            )

        namespace = uuid5(NAMESPACE_URL, f"bjeyflow:seed:v1:{user.pk}")
        counts = {
            "projects": 0,
            "tasks": 0,
            "subtasks": 0,
            "skipped": 0,
            "user_created": user_created,
            "generated_password": generated_password,
        }
        projects = {}
        for position, (key, name, description, color) in enumerate(PROJECTS):
            project, created = Project.objects.get_or_create(
                pk=uuid5(namespace, f"project:{key}"),
                defaults={
                    "owner": user,
                    "name": name,
                    "description": description,
                    "color": color,
                    "position": position,
                },
            )
            if project.owner_id != user.pk:
                raise CommandError(
                    "A seed project belongs to a different user; no data was changed."
                )
            projects[key] = project
            counts["projects"] += created

        today = timezone.localdate()
        now = timezone.now()
        for position, sample in enumerate(TASKS):
            status = sample.get("status", Task.Status.TODO)
            day = sample["day"]
            project = projects[sample["project"]]
            task_id = uuid5(namespace, f"task:{sample['key']}")
            if project.is_archived and not Task.objects.filter(pk=task_id).exists():
                counts["skipped"] += 1
                continue
            task, created = Task.objects.get_or_create(
                pk=task_id,
                defaults={
                    "project": project,
                    "title": sample["title"],
                    "description": "Sample task for exploring BjeyFlow. You can edit or delete it.",
                    "status": status,
                    "priority": sample.get("priority", Task.Priority.NORMAL),
                    "due_date": (
                        today + timedelta(days=day) if day is not None else None
                    ),
                    "due_time": sample.get("time"),
                    "position": position,
                    "completed_at": (
                        now + timedelta(days=min(day or 0, 0))
                        if status == Task.Status.COMPLETED
                        else None
                    ),
                },
            )
            if task.project.owner_id != user.pk:
                raise CommandError(
                    "A seed task belongs to a different user; no data was changed."
                )
            counts["tasks"] += created
            for index, (title, completed) in enumerate(sample.get("subtasks", ())):
                item, created = SubTask.objects.get_or_create(
                    pk=uuid5(namespace, f"subtask:{sample['key']}:{index}"),
                    defaults={
                        "task": task,
                        "title": title,
                        "is_completed": completed,
                        "position": index,
                    },
                )
                if item.task_id != task.pk:
                    raise CommandError(
                        "A seed subtask has a different parent; no data was changed."
                    )
                counts["subtasks"] += created
        return counts
