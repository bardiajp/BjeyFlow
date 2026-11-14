from rest_framework import serializers

from core.models import SubTask


class SubTaskSerializer(serializers.ModelSerializer):
    task = serializers.UUIDField(source="task_id", read_only=True)

    class Meta:
        model = SubTask
        fields = (
            "id",
            "task",
            "title",
            "is_completed",
            "position",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "task", "created_at", "updated_at")


class SubTaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ("title", "position", "is_completed")
