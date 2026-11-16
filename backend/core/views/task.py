from django.db.models import Count, Q, CharField, Value
from django.db.models.functions import Cast, Concat
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.filters.task import TaskFilter
from core.models import Task
from core.permissions import IsProjectOwner
from core.serializers.task import TaskCreateSerializer, TaskSerializer
from core.services.task import task_service
from core.services.xp import sync_task_xp
from core.services.reorder import reorder_tasks
from core.serializers.reorder import TaskReorderSerializer


class TaskViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated, IsProjectOwner)
    lookup_value_converter = "uuid"
    filterset_class = TaskFilter
    ordering = ("position", "created_at", "id")
    search_fields = ("title", "description", "task_key")
    ordering_fields = (
        "due_date",
        "due_time",
        "position",
        "created_at",
        "updated_at",
        "completed_at",
        "title",
    )

    def get_queryset(self):
        return (
            Task.objects.filter(
                project__owner=self.request.user,
                deleted_at__isnull=self.action not in {"trash", "restore", "permanent"},
            )
            .select_related("project")
            .prefetch_related("subtasks")
            .annotate(
                task_key=Concat(
                    "project__key", Value("-"), Cast("number", output_field=CharField())
                ),
                subtasks_count=Count("subtasks"),
                completed_subtasks_count=Count(
                    "subtasks", filter=Q(subtasks__is_completed=True)
                ),
            )
        )

    def get_serializer_class(self):
        if self.action == "reorder":
            return TaskReorderSerializer
        return TaskCreateSerializer if self.action == "create" else TaskSerializer

    def perform_destroy(self, instance):
        with transaction.atomic():
            task = get_object_or_404(
                Task.objects.select_for_update().filter(
                    project__owner=self.request.user, deleted_at__isnull=True
                ),
                pk=instance.pk,
            )
            task.deleted_at = timezone.now()
            task.save(update_fields=["deleted_at", "updated_at"])
            sync_task_xp(task, self.request.user)

    @action(detail=False, methods=["get"], ordering=("-deleted_at", "id"))
    def trash(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(
                self.get_serializer(page, many=True).data
            )
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=True, methods=["post"])
    def restore(self, request, *args, **kwargs):
        with transaction.atomic():
            task = get_object_or_404(
                Task.objects.select_for_update().filter(
                    project__owner=request.user, deleted_at__isnull=False
                ),
                pk=kwargs["pk"],
            )
            task.deleted_at = None
            task.save(update_fields=["deleted_at", "updated_at"])
            sync_task_xp(task, request.user)
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=["delete"])
    def permanent(self, request, *args, **kwargs):
        with transaction.atomic():
            task = get_object_or_404(
                Task.objects.select_for_update().filter(
                    project__owner=request.user, deleted_at__isnull=False
                ),
                pk=kwargs["pk"],
            )
            task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _change_status(self, status):
        instance = task_service.update_task(
            self.request.user, self.get_object(), {"status": status}
        )
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, *args, **kwargs):
        return self._change_status(Task.Status.COMPLETED)

    @action(detail=True, methods=["post"])
    def reopen(self, request, *args, **kwargs):
        return self._change_status(Task.Status.TODO)

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reorder_tasks(request.user, serializer.validated_data["items"])
        return Response({"detail": "Board order saved."})
