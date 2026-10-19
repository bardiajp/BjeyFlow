from django.db.models.deletion import ProtectedError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.auth import change_password
from users.models import User
from users.permissions import IsSystemAdministrator
from users.serializers.auth import ResetPasswordSerializer
from users.serializers.management import ManagedUserSerializer


class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = ManagedUserSerializer
    permission_classes = (IsAuthenticated, IsSystemAdministrator)

    def perform_destroy(self, instance):
        if (
            instance.is_superuser
            and not User.objects.filter(is_superuser=True, is_active=True)
            .exclude(pk=instance.pk)
            .exists()
        ):
            msg = "At least one active system administrator must remain."
            raise ValidationError({"detail": msg})
        try:
            instance.delete()
        except ProtectedError as error:
            raise ValidationError(
                {
                    "detail": "This account owns projects containing tasks. Remove its tasks before deleting the account."
                }
            ) from error

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            msg = "You cannot delete your own account."
            raise ValidationError({"detail": msg})
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def disable(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            msg = "You cannot disable your own account."
            raise ValidationError({"detail": msg})
        if not instance.is_active:
            msg = "User is already disabled."
            raise ValidationError({"detail": msg})
        if (
            instance.is_superuser
            and not User.objects.filter(is_superuser=True, is_active=True)
            .exclude(pk=instance.pk)
            .exists()
        ):
            msg = "At least one active system administrator must remain."
            raise ValidationError({"detail": msg})

        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"])
    def activate(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_active:
            msg = "User is already active."
            raise ValidationError({"detail": msg})
        instance.is_active = True
        instance.save(update_fields=["is_active"])
        return Response(self.get_serializer(instance).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="reset-password",
        permission_classes=[IsAuthenticated, IsSystemAdministrator],
    )
    def reset_password(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            msg = "Use the change-password endpoint to update your own password."
            raise ValidationError({"detail": msg})

        serializer = ResetPasswordSerializer(
            data=request.data, context={"user": instance}
        )
        serializer.is_valid(raise_exception=True)
        change_password(instance, serializer.validated_data["new_password"])
        return Response({"detail": "Password reset successfully."})
