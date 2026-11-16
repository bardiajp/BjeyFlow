from __future__ import annotations

import uuid

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.db.models.functions import Lower


class UserManager(BaseUserManager):
    def create_user(self, username: str, password: str | None = None, **extra) -> User:
        if not username:
            raise ValueError("Username is required")
        username = self.model.normalize_username(username)
        user = self.model(username=username, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self, username: str, password: str | None = None, **extra
    ) -> User:
        extra["is_staff"] = True
        extra["is_superuser"] = True
        return self.create_user(username, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    username_changed_at = models.DateTimeField(null=True, blank=True)
    display_name = models.CharField(max_length=150, blank=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    mobile = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True, default="")
    flow_name = models.CharField(max_length=60, blank=True)
    focus_style = models.CharField(
        max_length=20,
        default="steady_tide",
        choices=[
            ("morning_tide", "Morning tide"),
            ("night_current", "Night current"),
            ("steady_tide", "Steady tide"),
        ],
    )
    north_star = models.CharField(max_length=200, blank=True)
    avatar = models.TextField(blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["display_name"]

    objects = UserManager()

    class Meta:
        ordering = ["username"]
        constraints = [
            models.UniqueConstraint(
                Lower("email"),
                condition=~models.Q(email=""),
                name="users_email_lower_unique",
            )
        ]

    def __str__(self) -> str:
        return self.username

    @property
    def role(self) -> str:
        if self.is_superuser:
            return "superuser"
        if self.is_staff:
            return "staff"
        return "user"

    def set_role(self, role: str) -> None:
        roles = {
            "superuser": (True, True),
            "staff": (False, True),
            "user": (False, False),
        }
        try:
            self.is_superuser, self.is_staff = roles[role]
        except KeyError as err:
            raise ValueError(f"Invalid role: {role}") from err

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.is_staff = True
        super().save(*args, **kwargs)
