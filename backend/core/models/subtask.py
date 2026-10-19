from django.db import models

from .base import BaseModel


class SubTask(BaseModel):
    task = models.ForeignKey(
        "core.Task", on_delete=models.CASCADE, related_name="subtasks"
    )
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "created_at", "id"]
        indexes = [
            models.Index(
                fields=["task", "is_completed"], name="subtask_task_completed_idx"
            ),
        ]

    def __str__(self):
        return self.title
