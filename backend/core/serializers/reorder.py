from rest_framework import serializers

from core.models import Task


class SubTaskReorderSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.UUIDField(), max_length=1000)

    def validate_ids(self, ids):
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Each subtask must appear exactly once.")
        return ids


class TaskReorderItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=Task.Status.choices)
    position = serializers.IntegerField(min_value=0, max_value=2147483647)


class TaskReorderSerializer(serializers.Serializer):
    items = TaskReorderItemSerializer(many=True, allow_empty=False, max_length=1000)

    def validate_items(self, items):
        ids = [item["id"] for item in items]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Each task must appear exactly once.")
        places = [(item["status"], item["position"]) for item in items]
        if len(places) != len(set(places)):
            raise serializers.ValidationError(
                "Positions within a column must be distinct."
            )
        return items
