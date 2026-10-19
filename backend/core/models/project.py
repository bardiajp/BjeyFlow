from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

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

    def __str__(self):
        return self.name
