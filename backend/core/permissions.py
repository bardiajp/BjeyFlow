from rest_framework.permissions import BasePermission

from core.models import Project, SubTask, Task


class IsProjectOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Project):
            return obj.owner_id == request.user.pk
        if isinstance(obj, Task):
            return obj.project.owner_id == request.user.pk
        if isinstance(obj, SubTask):
            return obj.task.project.owner_id == request.user.pk
        return False
