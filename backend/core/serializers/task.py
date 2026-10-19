from rest_framework import serializers

from core.models import Project, Task
from core.serializers.subtask import SubTaskCreateSerializer, SubTaskSerializer
from core.services.task import task_service


class TaskSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(), pk_field=serializers.UUIDField()
    )
    project_name = serializers.CharField(source="project.name", read_only=True)
    subtasks = SubTaskSerializer(many=True, read_only=True)
    subtasks_count = serializers.SerializerMethodField()
    completed_subtasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "due_time",
            "position",
            "completed_at",
            "subtasks",
            "subtasks_count",
            "completed_subtasks_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "completed_at", "created_at", "updated_at")

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            fields["project"].queryset = Project.objects.filter(owner=request.user)
        return fields

    def validate_project(self, project):
        if project.is_archived and (
            self.instance is None or self.instance.project_id != project.pk
        ):
            raise serializers.ValidationError(
                "Cannot add tasks to an archived project."
            )
        return project

    def validate(self, attrs):
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        due_time = attrs.get("due_time", getattr(self.instance, "due_time", None))
        if due_time is not None and due_date is None:
            raise serializers.ValidationError(
                {"due_time": "A due time requires a due date."}
            )
        if self.instance is not None and "subtasks" in self.initial_data:
            raise serializers.ValidationError(
                {
                    "subtasks": "Use the task's subtask endpoint to update checklist items."
                }
            )
        return attrs

    def get_subtasks_count(self, instance):
        value = getattr(instance, "subtasks_count", None)
        return value if value is not None else instance.subtasks.count()

    def get_completed_subtasks_count(self, instance):
        value = getattr(instance, "completed_subtasks_count", None)
        if value is not None:
            return value
        cached = getattr(instance, "_prefetched_objects_cache", {}).get("subtasks")
        if cached is not None:
            return sum(item.is_completed for item in cached)
        return instance.subtasks.filter(is_completed=True).count()

    def create(self, validated_data):
        return task_service.create_task(self.context["request"].user, validated_data)

    def update(self, instance, validated_data):
        return task_service.update_task(
            self.context["request"].user, instance, validated_data
        )


class TaskCreateSerializer(TaskSerializer):
    subtasks = SubTaskCreateSerializer(many=True, required=False, write_only=True)

    def to_representation(self, instance):
        return TaskSerializer(instance, context=self.context).data
