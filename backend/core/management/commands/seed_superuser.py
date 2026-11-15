import getpass
import os
import sys

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create an initial superuser without changing existing accounts."
    requires_migrations_checks = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--username", default=os.environ.get("DJANGO_SUPERUSER_USERNAME")
        )
        parser.add_argument(
            "--display-name", default=os.environ.get("DJANGO_SUPERUSER_DISPLAY_NAME")
        )
        parser.add_argument("--email", default=os.environ.get("DJANGO_SUPERUSER_EMAIL"))

    def handle(self, *args, **options):
        User = get_user_model()
        username = options["username"]
        if not username:
            if not sys.stdin.isatty():
                raise CommandError(
                    "Provide DJANGO_SUPERUSER_USERNAME or run interactively."
                )
            username = input("Username: ")
        username = User.normalize_username(username.strip())
        if not username:
            raise CommandError("Username is required.")
        existing = User.objects.filter(username=username).first()
        if existing:
            if not existing.is_superuser or not existing.is_active:
                raise CommandError(
                    "This username belongs to an existing non-superuser or inactive account; it was not changed."
                )
            self.stdout.write(
                self.style.SUCCESS("Superuser already exists; no changes made.")
            )
            return

        display_name = options["display_name"]
        if display_name is None:
            if not sys.stdin.isatty():
                raise CommandError(
                    "Provide DJANGO_SUPERUSER_DISPLAY_NAME or run interactively."
                )
            display_name = input("Display name: ").strip()
        email = options["email"]
        if email is None:
            if not sys.stdin.isatty():
                raise CommandError(
                    "Provide DJANGO_SUPERUSER_EMAIL or run interactively."
                )
            email = input("Email (optional): ").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        if password is None:
            if not sys.stdin.isatty():
                raise CommandError(
                    "Provide DJANGO_SUPERUSER_PASSWORD or run interactively."
                )
            password = getpass.getpass("Password: ")
            if password != getpass.getpass("Password (again): "):
                raise CommandError("Passwords do not match.")
        user = User(
            username=username,
            display_name=display_name,
            email=email,
            is_staff=True,
            is_superuser=True,
        )
        try:
            user.full_clean(exclude=["password"])
            validate_password(password, user)
        except ValidationError as error:
            raise CommandError(" ".join(error.messages)) from error
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Superuser {username} created."))
