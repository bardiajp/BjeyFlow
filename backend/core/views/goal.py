from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.mixins import CreateModelMixin, DestroyModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.viewsets import GenericViewSet

from core.models import Goal, Milestone
from core.serializers.goal import GoalSerializer, MilestoneSerializer


class GoalViewSet(CreateModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin, DestroyModelMixin, GenericViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = GoalSerializer
    lookup_value_converter = "uuid"

    def get_queryset(self):
        return Goal.objects.filter(owner=self.request.user).prefetch_related("milestones__tasks")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class MilestoneViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = MilestoneSerializer
    lookup_value_converter = "uuid"
    http_method_names = ["get", "post", "patch", "put", "delete", "head", "options"]

    def get_queryset(self):
        return Milestone.objects.filter(goal__owner=self.request.user).select_related("goal").prefetch_related("tasks")
