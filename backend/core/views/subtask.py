from functools import cached_property

from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from core.models import Task
from core.permissions import IsProjectOwner
from core.serializers.subtask import SubTaskSerializer


class SubTaskViewSet(ModelViewSet):
    serializer_class = SubTaskSerializer
    permission_classes = (IsAuthenticated, IsProjectOwner)
    lookup_value_converter = "uuid"
    filterset_fields = ("is_completed",)
    search_fields = ("title",)
    ordering_fields = ("position", "created_at", "updated_at")
    ordering = ("position", "created_at", "id")

    @cached_property
    def parent_task(self):
        return get_object_or_404(
            Task.objects.select_related("project").filter(
                project__owner=self.request.user
            ),
            pk=self.kwargs["task_pk"],
        )

    def get_queryset(self):
        return self.parent_task.subtasks.select_related("task__project")

    def perform_create(self, serializer):
        serializer.save(task=self.parent_task)
