from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from core.models import Project, SubTask, Task


class TaskService:
    @staticmethod
    def _project_for_write(project, owner, current_project_id=None):
        project = get_object_or_404(
            Project.objects.select_for_update().filter(owner=owner), pk=project.pk
        )
        if project.is_archived and project.pk != current_project_id:
            raise ValidationError(
                {"project": "Cannot add tasks to an archived project."}
            )
        return project

    @staticmethod
    def _set_completion(data, instance=None):
        status = data.get("status", instance.status if instance else Task.Status.TODO)
        if status == Task.Status.COMPLETED:
            data["completed_at"] = (
                instance.completed_at if instance else None
            ) or timezone.now()
        else:
            data["completed_at"] = None

    @transaction.atomic
    def create_task(self, owner, validated_data):
        data = validated_data.copy()
        subtasks = data.pop("subtasks", [])
        data["project"] = self._project_for_write(data["project"], owner)
        self._set_completion(data)
        instance = Task.objects.create(**data)
        SubTask.objects.bulk_create(
            [
                SubTask(task=instance, **{"position": index, **item})
                for index, item in enumerate(subtasks)
            ]
        )
        return instance

    @transaction.atomic
    def update_task(self, owner, instance, validated_data):
        instance = get_object_or_404(
            Task.objects.select_for_update().filter(project__owner=owner),
            pk=instance.pk,
        )
        data = validated_data.copy()
        if "project" in data:
            data["project"] = self._project_for_write(
                data["project"], owner, current_project_id=instance.project_id
            )
        for field in ("due_date", "due_time"):
            data.setdefault(field, getattr(instance, field))
        if data["due_time"] is not None and data["due_date"] is None:
            raise ValidationError({"due_time": "A due time requires a due date."})
        self._set_completion(data, instance)
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


task_service = TaskService()
