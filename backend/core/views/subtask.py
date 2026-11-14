from functools import cached_property

from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Task
from core.permissions import IsProjectOwner
from core.serializers.subtask import SubTaskSerializer
from core.serializers.reorder import SubTaskReorderSerializer
from core.services.reorder import reorder_subtasks


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

    @action(detail=False, methods=["post"], serializer_class=SubTaskReorderSerializer)
    def reorder(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reorder_subtasks(
            request.user, self.parent_task.pk, serializer.validated_data["ids"]
        )
        return Response(
            SubTaskSerializer(
                self.get_queryset(), many=True, context=self.get_serializer_context()
            ).data
        )
