from rest_framework import serializers

from core.models import Goal, Milestone, Task


class MilestoneSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    goal = serializers.PrimaryKeyRelatedField(queryset=Goal.objects.none())

    class Meta:
        model = Milestone
        fields = ("id", "goal", "title", "description", "target_date", "position", "progress", "tasks_count", "completed_tasks_count", "is_completed", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def get_fields(self):
        fields = super().get_fields()
        fields["goal"].queryset = Goal.objects.filter(owner=self.context["request"].user, is_archived=False)
        return fields

    def _tasks(self, obj):
        return [task for task in obj.tasks.all() if task.deleted_at is None]

    def get_tasks_count(self, obj):
        return len(self._tasks(obj))

    def get_completed_tasks_count(self, obj):
        return sum(task.status == Task.Status.COMPLETED for task in self._tasks(obj))

    def get_progress(self, obj):
        total = self.get_tasks_count(obj)
        return round(100 * self.get_completed_tasks_count(obj) / total) if total else 0

    def get_is_completed(self, obj):
        total = self.get_tasks_count(obj)
        return total > 0 and self.get_completed_tasks_count(obj) == total


class GoalSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = ("id", "title", "description", "target_date", "position", "is_archived", "progress", "milestones", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def get_progress(self, obj):
        milestones = list(obj.milestones.all())
        serializer = MilestoneSerializer(context=self.context)
        return round(sum(serializer.get_progress(m) for m in milestones) / len(milestones)) if milestones else 0
