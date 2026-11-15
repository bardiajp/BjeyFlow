from rest_framework import serializers

from core.models import Project
from core.services.project import project_service


class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.UUIDField(source="owner_id", read_only=True)
    tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "owner",
            "name",
            "key",
            "description",
            "icon",
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

    def get_tasks_count(self, instance):
        count = getattr(instance, "tasks_count", None)
        return (
            count
            if count is not None
            else instance.tasks.filter(deleted_at__isnull=True).count()
        )

    def validate_key(self, value):
        queryset = Project.objects.filter(owner=self.context["request"].user, key=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "You already have a project with this key."
            )
        return value

    def update(self, instance, validated_data):
        return project_service.update_project(
            self.context["request"].user, instance, validated_data
        )
