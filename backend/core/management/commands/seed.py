import os
import secrets
from datetime import time, timedelta
from uuid import NAMESPACE_URL, uuid4, uuid5

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.models import Project, SubTask, Task


PROJECTS = (
    (
        "website",
        "Website refresh",
        "A fresh, thoughtful home for our work.",
        "#8ECAE6",
        "code",
    ),
    (
        "product",
        "Product studio",
        "Ideas, feedback, and the next iteration.",
        "#FB8500",
        "palette",
    ),
    (
        "personal",
        "Personal",
        "Make room for the things outside work.",
        "#90BE6D",
        "heart",
    ),
    ("reading", "Reading list", "A little learning every day.", "#B8A1D9", "book"),
    (
        "learning",
        "Learning lab",
        "Build a little knowledge every week.",
        "#023047",
        "target",
    ),
    (
        "client-work",
        "Client work",
        "Deliver thoughtful work for our clients.",
        "#696969",
        "briefcase",
    ),
    (
        "notes",
        "Notes and ideas",
        "Collect ideas before they slip away.",
        "#8ECAE6",
        "folder",
    ),
    (
        "health",
        "Healthy habits",
        "Small steps toward a healthier routine.",
        "#90BE6D",
        "star",
    ),
    (
        "home",
        "Home and life",
        "Keep the everyday things in order.",
        "#FB8500",
        "coffee",
    ),
    ("music", "Music", "A little time for creative practice.", "#B8A1D9", "music"),
    ("travel", "Travel plans", "Plan the next little adventure.", "#023047", "rocket"),
    (
        "ideas",
        "Side projects",
        "Try something new without the pressure.",
        "#696969",
        "hash",
    ),
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
    help = "Create configurable development projects, tasks, and subtasks without overwriting existing data."
    requires_migrations_checks = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default=os.environ.get("SEED_USERNAME") or "demo",
            help="Demo account username (defaults to SEED_USERNAME or demo).",
        )
        parser.add_argument(
            "--projects",
            type=int,
            default=12,
            help="Number of sample projects (1–100).",
        )
        parser.add_argument(
            "--tasks", type=int, default=120, help="Number of sample tasks (0–10000)."
        )
        parser.add_argument(
            "--subtasks",
            type=int,
            default=5,
            help="Maximum subtasks per new task (0–20).",
        )
        parser.add_argument(
            "--append",
            action="store_true",
            help="Add a fresh, separately named sample batch instead of filling the default dataset.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Seed data is only available with DEBUG=True.")

        username = get_user_model().normalize_username(options["username"].strip())
        if not username or len(username) > 150:
            raise CommandError("The seed username must contain 1–150 characters.")
        limits = (("projects", 1, 100), ("tasks", 0, 10000), ("subtasks", 0, 20))
        for key, minimum, maximum in limits:
            if not minimum <= options[key] <= maximum:
                raise CommandError(f"--{key} must be between {minimum} and {maximum}.")
        result = self.seed(
            username,
            options["projects"],
            options["tasks"],
            options["subtasks"],
            options["append"],
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete for {username}: created {result['projects']} projects, "
                f"{result['tasks']} tasks, and {result['subtasks']} subtasks."
            )
        )
        self.stdout.write(
            f"Account totals: {result['total_projects']} projects, {result['total_tasks']} tasks, "
            f"{result['total_subtasks']} subtasks."
        )
        self.stdout.write(
            f"Sign in as {username} to see this data. Use SEED_USERNAME=<your-login> with make seed to target another account."
        )
        if result["batch"]:
            self.stdout.write(f"Fresh sample batch: {result['batch']}")
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
        if not options["append"] and not (
            result["projects"] or result["tasks"] or result["subtasks"]
        ):
            self.stdout.write(
                "The requested sample dataset already exists. Increase the counts or use SEED_ARGS='--append' with make seed for a fresh batch."
            )
        if result["skipped"]:
            self.stdout.write(
                f"Skipped {result['skipped']} missing tasks in archived projects."
            )

    @transaction.atomic
    def seed(
        self, username, project_count=12, task_count=120, max_subtasks=5, append=False
    ):
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
        batch = uuid4() if append else None
        if batch:
            namespace = uuid5(namespace, f"batch:{batch}")
        counts = {
            "projects": 0,
            "tasks": 0,
            "subtasks": 0,
            "skipped": 0,
            "user_created": user_created,
            "generated_password": generated_password,
            "batch": str(batch)[:8] if batch else None,
        }
        projects = {}
        archive_after_seed = []
        for position in range(project_count):
            if position < len(PROJECTS):
                key, name, description, color, icon = PROJECTS[position]
            else:
                key = f"project-{position}"
                name = f"Sandbox project {position + 1}"
                description = "An extra development project for testing larger lists."
                color = PROJECTS[position % len(PROJECTS)][3]
                icon = Project.Icon.values[position % len(Project.Icon.values)]
            if batch:
                name = f"{name} [seed {str(batch)[:8]}]"
            project, created = Project.objects.get_or_create(
                pk=uuid5(namespace, f"project:{key}"),
                defaults={
                    "owner": user,
                    "name": name,
                    "description": description,
                    "color": color,
                    "icon": icon,
                    "position": position,
                },
            )
            if project.owner_id != user.pk:
                raise CommandError(
                    "A seed project belongs to a different user; no data was changed."
                )
            projects[key] = project
            counts["projects"] += created
            if created and project_count >= 6 and position == project_count - 1:
                archive_after_seed.append(project.pk)

        today = timezone.localdate()
        now = timezone.now()
        for position, sample in enumerate(
            self.task_samples(list(projects), task_count, max_subtasks)
        ):
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
                    "description": sample.get(
                        "description",
                        "Sample task for exploring BjeyFlow. You can edit or delete it.",
                    ),
                    "status": status,
                    "priority": sample.get("priority", Task.Priority.NORMAL),
                    "due_date": (
                        today + timedelta(days=day) if day is not None else None
                    ),
                    "due_time": sample.get("time"),
                    "position": position,
                    "completed_at": (
                        now
                        - timedelta(
                            days=sample.get("completed_days_ago", max(0, -(day or 0)))
                        )
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
        Project.objects.filter(pk__in=archive_after_seed).update(
            is_archived=True, updated_at=now
        )
        counts["total_projects"] = user.projects.count()
        counts["total_tasks"] = Task.objects.filter(project__owner=user).count()
        counts["total_subtasks"] = SubTask.objects.filter(
            task__project__owner=user
        ).count()
        return counts

    @staticmethod
    def task_samples(project_keys, task_count, max_subtasks):
        verbs = (
            "Review",
            "Draft",
            "Organize",
            "Plan",
            "Prepare",
            "Update",
            "Check",
            "Finish",
        )
        subjects = (
            "the next milestone",
            "the weekly plan",
            "the first draft",
            "the project checklist",
            "the design details",
            "the meeting notes",
            "the follow-up",
            "the research summary",
        )
        steps = (
            "Clarify the goal",
            "Gather the references",
            "Prepare a first draft",
            "Review the details",
            "Collect feedback",
            "Make the final changes",
            "Share the result",
            "Write a follow-up",
        )
        for index in range(task_count):
            if index < len(TASKS):
                sample = TASKS[index].copy()
                if sample["project"] not in project_keys:
                    sample["project"] = project_keys[index % len(project_keys)]
                sample["subtasks"] = sample.get("subtasks", ())[:max_subtasks]
                yield sample
                continue
            status = Task.Status.values[(index // 8) % len(Task.Status.values)]
            bucket = index % 8
            day = (
                0,
                0,
                1 + index % 7,
                1 + index % 7,
                -1 - index % 7,
                None,
                8 + index % 21,
                0,
            )[bucket]
            child_count = index % (max_subtasks + 1)
            completed_children = (
                child_count
                if status == Task.Status.COMPLETED
                else child_count // (2 if status == Task.Status.IN_PROGRESS else 3)
            )
            title = f"{verbs[index % len(verbs)]} {subjects[(index // len(verbs)) % len(subjects)]} ({index + 1:03})"
            if index % 11 == 0:
                title += " with feedback from the latest project review"
            yield {
                "key": f"generated-task:{index}",
                "project": project_keys[index % len(project_keys)],
                "title": title,
                "description": "Development sample for exploring task details.\n\nTry changing its project, deadline, priority, status, or checklist.",
                "day": day,
                "time": (
                    time(9 + index % 10, 30 if index % 2 else 0)
                    if day is not None and index % 3
                    else None
                ),
                "status": status,
                "priority": Task.Priority.values[index % len(Task.Priority.values)],
                "completed_days_ago": index % 7,
                "subtasks": tuple(
                    (
                        f"{steps[step % len(steps)]} ({step + 1})",
                        step < completed_children,
                    )
                    for step in range(child_count)
                ),
            }
