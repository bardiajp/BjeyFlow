from django.db.models.deletion import ProtectedError
from django.db import transaction
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from core.models import Project


class ProjectService:
    @staticmethod
    @transaction.atomic
    def create_project(owner, validated_data):
        get_user_model().objects.select_for_update().get(pk=owner.pk)
        if Project.objects.filter(owner=owner, key=validated_data["key"]).exists():
            raise ValidationError({"key": "You already have a project with this key."})
        return Project.objects.create(owner=owner, **validated_data)

    @staticmethod
    @transaction.atomic
    def update_project(owner, instance, validated_data):
        get_user_model().objects.select_for_update().get(pk=owner.pk)
        instance = get_object_or_404(
            Project.objects.select_for_update(), pk=instance.pk, owner=owner
        )
        key = validated_data.get("key", instance.key)
        if (
            Project.objects.filter(owner=owner, key=key)
            .exclude(pk=instance.pk)
            .exists()
        ):
            raise ValidationError({"key": "You already have a project with this key."})
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    @staticmethod
    @transaction.atomic
    def delete_project(instance):
        instance = get_object_or_404(
            Project.objects.select_for_update(), pk=instance.pk
        )
        try:
            instance.delete()
        except ProtectedError as error:
            raise ValidationError(
                {
                    "detail": "Projects containing tasks cannot be deleted. Archive the project instead."
                }
            ) from error


project_service = ProjectService()
