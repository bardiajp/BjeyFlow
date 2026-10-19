from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

from .base import BaseModel


class Project(BaseModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
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
