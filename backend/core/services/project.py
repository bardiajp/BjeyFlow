from django.db.models.deletion import ProtectedError
from rest_framework.exceptions import ValidationError

from core.models import Project


class ProjectService:
    @staticmethod
    def create_project(owner, validated_data):
        return Project.objects.create(owner=owner, **validated_data)

    @staticmethod
    def delete_project(instance):
        try:
            instance.delete()
        except ProtectedError as error:
            raise ValidationError(
                {
                    "detail": "Projects containing tasks cannot be deleted. Archive the project instead."
                }
            ) from error


project_service = ProjectService()
