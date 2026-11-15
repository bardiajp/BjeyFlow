from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models, transaction
from itertools import product
import re
from string import ascii_uppercase

from .base import BaseModel


class Project(BaseModel):
    class Icon(models.TextChoices):
        HASH = "hash", "Hash"
        FOLDER = "folder", "Folder"
        BRIEFCASE = "briefcase", "Briefcase"
        CODE = "code", "Code"
        BOOK = "book", "Book"
        HEART = "heart", "Heart"
        STAR = "star", "Star"
        TARGET = "target", "Target"
        PALETTE = "palette", "Palette"
        COFFEE = "coffee", "Coffee"
        MUSIC = "music", "Music"
        ROCKET = "rocket", "Rocket"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=150)
    key = models.CharField(
        max_length=4,
        validators=[
            RegexValidator(r"^[A-Z]{2,4}$", "Use 2–4 uppercase letters, such as FLOW.")
        ],
    )
    task_sequence = models.PositiveBigIntegerField(default=0, editable=False)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=20, choices=Icon.choices, default=Icon.HASH)
    color = models.CharField(
        max_length=7,
        default="#8ECAE6",
        validators=[
            RegexValidator(r"^#[0-9a-fA-F]{6}$", "Use a hex color like #8ECAE6.")
        ],
    )
    position = models.PositiveIntegerField(default=0)
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["position", "created_at", "id"]
        indexes = [
            models.Index(
                fields=["owner", "is_archived"], name="project_owner_archived_idx"
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "key"], name="project_owner_key_unique"
            ),
            models.CheckConstraint(
                condition=models.Q(key__regex=r"^[A-Z]{2,4}$"),
                name="project_key_uppercase",
            ),
        ]

    @transaction.atomic
    def save(self, *args, **kwargs):
        if self._state.adding and not self.key:
            get_user_model().objects.select_for_update().get(pk=self.owner_id)
            used = set(
                Project.objects.filter(owner_id=self.owner_id).values_list(
                    "key", flat=True
                )
            )
            letters = re.sub(r"[^A-Z]", "", self.name.upper())
            candidate = letters[:4] if len(letters) >= 2 else "PR"
            if candidate in used:
                candidate = next(
                    (
                        "".join(parts)
                        for parts in product(ascii_uppercase, repeat=4)
                        if "".join(parts) not in used
                    ),
                    None,
                )
            if candidate is None:
                raise ValidationError("No project keys are available for this account.")
            self.key = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
