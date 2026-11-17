from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from administration.audit import record_event
from users.models import User
from core.models import Project, Task


class UserManagementService:
    @staticmethod
    @transaction.atomic
    def transfer_superuser(actor, instance):
        list(User.objects.filter(is_superuser=True).order_by("pk").select_for_update())
        actor = User.objects.select_for_update().get(pk=actor.pk)
        instance = User.objects.select_for_update().get(pk=instance.pk)
        if not actor.is_active or not actor.is_superuser:
            raise PermissionDenied("Only a system administrator can transfer this role.")
        if actor.pk == instance.pk or not instance.is_active:
            raise ValidationError({"detail": "Choose another active account."})
        instance.set_role("superuser")
        instance.save(update_fields=["is_staff", "is_superuser"])
        actor.set_role("staff")
        actor.save(update_fields=["is_staff", "is_superuser"])
        record_event("user.superuser_transferred", actor=actor, target=instance.username)
        return instance

    @staticmethod
    @transaction.atomic
    def delete_own_account(actor, password):
        list(User.objects.filter(is_superuser=True).order_by("pk").select_for_update())
        actor = User.objects.select_for_update().get(pk=actor.pk)
        if not actor.check_password(password):
            raise ValidationError({"password": "Incorrect password."})
        if actor.is_superuser and not User.objects.filter(
            is_superuser=True, is_active=True
        ).exclude(pk=actor.pk).exists():
            raise ValidationError(
                {"detail": "Transfer the system administrator role before deleting your account."}
            )
        record_event("user.self_deleted", actor=actor, target=actor.username)
        Task.objects.filter(project__owner=actor).delete()
        actor.delete()

    @staticmethod
    @transaction.atomic
    def create_user(actor, validated_data):
        list(User.objects.filter(is_superuser=True).order_by("pk").select_for_update())
        actor.refresh_from_db()
        if not actor.is_active or not (actor.is_staff or actor.is_superuser):
            raise PermissionDenied("Administrator access is required.")
        data = validated_data.copy()
        role = data.pop("role")
        password = data.pop("password")
        if not actor.is_superuser and role != "user":
            raise PermissionDenied(
                "Only a system administrator can assign administrator roles."
            )
        user = User()
        user.set_role(role)
        try:
            validate_password(password, User(**data))
        except DjangoValidationError as exc:
            raise ValidationError({"password": exc.messages}) from exc
        instance = User.objects.create_user(
            password=password,
            is_staff=user.is_staff,
            is_superuser=user.is_superuser,
            **data,
        )
        Project.objects.create(owner=instance, name="My Project", icon="folder")
        record_event(
            "user.created",
            actor=actor,
            target=instance.username,
            metadata={"role": role},
        )
        return instance

    @staticmethod
    def _locked_target(actor, instance):
        list(User.objects.filter(is_superuser=True).order_by("pk").select_for_update())
        actor.refresh_from_db()
        instance = User.objects.select_for_update().get(pk=instance.pk)
        if not actor.is_active or not (actor.is_staff or actor.is_superuser):
            raise PermissionDenied("Administrator access is required.")
        if not actor.is_superuser and (instance.is_staff or instance.is_superuser):
            raise PermissionDenied(
                "Only a system administrator can manage administrators."
            )
        return instance

    @staticmethod
    @transaction.atomic
    def update_user(actor, instance, validated_data):
        instance = UserManagementService._locked_target(actor, instance)
        data = validated_data.copy()
        new_role = data.get("role", instance.role)
        active = data.get("is_active", instance.is_active)
        if "username" in data and data["username"] != instance.username:
            if instance.username_changed_at and timezone.now() < instance.username_changed_at + timedelta(days=7):
                raise ValidationError({"username": "You can change this username once every 7 days."})
            data["username_changed_at"] = timezone.now()
        if not actor.is_superuser and new_role != "user":
            raise PermissionDenied(
                "Only a system administrator can assign administrator roles."
            )
        if actor.pk == instance.pk and (
            not active or new_role != instance.role or "password" in data
        ):
            raise ValidationError(
                {
                    "detail": "You cannot disable or change your own role here. Use Change password for your password."
                }
            )
        if (
            instance.is_superuser
            and (new_role != "superuser" or not active)
            and not User.objects.filter(is_superuser=True, is_active=True)
            .exclude(pk=instance.pk)
            .exists()
        ):
            raise ValidationError(
                {"detail": "At least one active system administrator must remain."}
            )
        role = data.pop("role", None)
        password = data.pop("password", None)
        if role is not None:
            instance.set_role(role)
            data["is_staff"] = instance.is_staff
            data["is_superuser"] = instance.is_superuser
        if password:
            try:
                validate_password(password, instance)
            except DjangoValidationError as exc:
                raise ValidationError({"password": exc.messages}) from exc
            instance.set_password(password)
            data["password"] = instance.password
        User.objects.filter(pk=instance.pk).update(**data)
        if password or not active:
            instance.account_sessions.filter(revoked_at__isnull=True).update(
                revoked_at=timezone.now()
            )
        instance.refresh_from_db()
        record_event(
            "user.updated",
            actor=actor,
            target=instance.username,
            metadata={
                "fields": sorted(validated_data),
                "role": instance.role,
                "is_active": instance.is_active,
            },
        )
        return instance

    @staticmethod
    @transaction.atomic
    def delete_user(actor, instance):
        instance = UserManagementService._locked_target(actor, instance)
        if instance.pk == actor.pk:
            raise ValidationError({"detail": "You cannot delete your own account."})
        if (
            instance.is_superuser
            and not User.objects.filter(is_superuser=True, is_active=True)
            .exclude(pk=instance.pk)
            .exists()
        ):
            raise ValidationError(
                {"detail": "At least one active system administrator must remain."}
            )
        username = instance.username
        try:
            instance.delete()
        except ProtectedError as exc:
            raise ValidationError(
                {
                    "detail": "This account owns projects containing tasks, including Trash. Remove its tasks before deleting the account."
                }
            ) from exc
        record_event("user.deleted", actor=actor, target=username)


user_management_service = UserManagementService()
