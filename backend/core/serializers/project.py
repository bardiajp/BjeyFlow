from rest_framework import serializers

from core.models import Project
from core.services.project import project_service


class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.UUIDField(source="owner_id", read_only=True)
    tasks_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Project
        fields = (
            "id",
            "owner",
            "name",
            "description",
            "color",
            "position",
            "is_archived",
            "tasks_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")

    def create(self, validated_data):
        return project_service.create_project(
            self.context["request"].user, validated_data
        )
