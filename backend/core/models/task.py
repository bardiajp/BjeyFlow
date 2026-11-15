from django.db import models, transaction
from django.db.models import Q

from .base import BaseModel


class Task(BaseModel):
    class Status(models.TextChoices):
        TODO = "todo", "To do"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    project = models.ForeignKey(
        "core.Project", on_delete=models.PROTECT, related_name="tasks"
    )
    title = models.CharField(max_length=255)
    number = models.PositiveBigIntegerField(editable=False)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.TODO
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.NORMAL
    )
    due_date = models.DateField(null=True, blank=True)
    due_time = models.TimeField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True, editable=False)
    deleted_at = models.DateTimeField(
        null=True, blank=True, editable=False, db_index=True
    )

    class Meta:
        ordering = ["position", "created_at", "id"]
        indexes = [
            models.Index(fields=["project", "status"], name="task_project_status_idx"),
            models.Index(
                fields=["due_date", "status"], name="task_due_date_status_idx"
            ),
            models.Index(fields=["completed_at"], name="task_completed_at_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "number"], name="task_project_number_unique"
            ),
            models.CheckConstraint(
                condition=Q(number__gt=0), name="task_number_positive"
            ),
            models.CheckConstraint(
                condition=Q(due_time__isnull=True) | Q(due_date__isnull=False),
                name="task_due_time_requires_date",
            ),
            models.CheckConstraint(
                condition=(
                    Q(status="completed", completed_at__isnull=False)
                    | (~Q(status="completed") & Q(completed_at__isnull=True))
                ),
                name="task_completion_time_consistent",
            ),
        ]

    def __str__(self):
        return self.title

    @property
    def identifier(self):
        return f"{self.project.key}-{self.number}"

    @transaction.atomic
    def save(self, *args, **kwargs):
        from .project import Project

        update_fields = kwargs.get("update_fields")
        check_move = (
            update_fields is None
            or "project" in update_fields
            or "project_id" in update_fields
        )
        moved = (
            not self._state.adding
            and check_move
            and Task.objects.filter(pk=self.pk)
            .exclude(project_id=self.project_id)
            .exists()
        )
        if self._state.adding or moved:
            project = Project.objects.select_for_update().get(pk=self.project_id)
            project.task_sequence += 1
            project.save(update_fields=["task_sequence"])
            self.number = project.task_sequence
            if update_fields is not None:
                kwargs["update_fields"] = set(update_fields) | {"number"}
        super().save(*args, **kwargs)
