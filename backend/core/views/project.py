from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from core.models import Project
from core.permissions import IsProjectOwner
from core.serializers.project import ProjectSerializer
from core.services.project import project_service


class ProjectViewSet(ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = (IsAuthenticated, IsProjectOwner)
    lookup_value_converter = "uuid"
    filterset_fields = ("is_archived",)
    search_fields = ("name", "description")
    ordering_fields = ("name", "position", "created_at", "updated_at")
    ordering = ("position", "created_at", "id")

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user).annotate(
            tasks_count=Count("tasks")
        )

    def perform_destroy(self, instance):
        project_service.delete_project(instance)
