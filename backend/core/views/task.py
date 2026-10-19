from django.db.models import Count, Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.filters.task import TaskFilter
from core.models import Task
from core.permissions import IsProjectOwner
from core.serializers.task import TaskCreateSerializer, TaskSerializer
from core.services.task import task_service


class TaskViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated, IsProjectOwner)
    lookup_value_converter = "uuid"
    filterset_class = TaskFilter
    ordering = ("position", "created_at", "id")
    search_fields = ("title", "description")
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
            Task.objects.filter(project__owner=self.request.user)
            .select_related("project")
            .prefetch_related("subtasks")
            .annotate(
                subtasks_count=Count("subtasks"),
                completed_subtasks_count=Count(
                    "subtasks", filter=Q(subtasks__is_completed=True)
                ),
            )
        )

    def get_serializer_class(self):
        return TaskCreateSerializer if self.action == "create" else TaskSerializer

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
