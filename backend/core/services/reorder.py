from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from core.models import SubTask, Task
from core.services.task import task_service


@transaction.atomic
def reorder_subtasks(owner, task_id, ids):
    task = get_object_or_404(
        Task.objects.select_for_update(of=("self",)).filter(project__owner=owner),
        pk=task_id,
    )
    items = list(task.subtasks.select_for_update().order_by("pk"))
    if {item.pk for item in items} != set(ids) or len(items) != len(ids):
        raise ValidationError(
            {
                "ids": "Include all current subtasks of this task exactly once. Refresh the checklist and try again."
            }
        )
    positions = {pk: index for index, pk in enumerate(ids)}
    now = timezone.now()
    for item in items:
        item.position = positions[item.pk]
        item.updated_at = now
    SubTask.objects.bulk_update(items, ["position", "updated_at"])


@transaction.atomic
def reorder_tasks(owner, items):
    tasks = list(
        Task.objects.select_for_update(of=("self",))
        .filter(project__owner=owner, pk__in=[item["id"] for item in items])
        .order_by("pk")
    )
    if len(tasks) != len(items):
        raise ValidationError(
            {
                "items": "One or more tasks are unavailable to your account. Refresh the board and try again."
            }
        )
    changes = {item["id"]: item for item in items}
    now = timezone.now()
    for task in tasks:
        data = changes[task.pk].copy()
        task_service._set_completion(data, task)
        task.status = data["status"]
        task.position = data["position"]
        task.completed_at = data["completed_at"]
        task.updated_at = now
    Task.objects.bulk_update(
        tasks, ["status", "position", "completed_at", "updated_at"]
    )
