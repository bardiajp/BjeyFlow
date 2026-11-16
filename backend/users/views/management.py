from smtplib import SMTPException

from django.db.models import Q, Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from administration.audit import record_event
from users.models import User
from users.permissions import HasAccountableRole
from users.serializers.auth import ResetPasswordSerializer
from users.serializers.management import ManagedUserSerializer
from users.services.management import user_management_service
from users.services.password_reset import send_password_reset


class AdminEmailThrottle(UserRateThrottle):
    scope = "admin_email"


class UserManagementViewSet(viewsets.ModelViewSet):
    serializer_class = ManagedUserSerializer
    permission_classes = (HasAccountableRole,)
    search_fields = ("username", "display_name", "email")
    filterset_fields = ("is_active", "is_staff", "is_superuser")

    def get_queryset(self):
        queryset = User.objects.annotate(active_xp=Sum("task_xp__amount", filter=Q(task_xp__active=True)))
        return (
            queryset
            if self.request.user.is_superuser
            else queryset.filter(is_staff=False, is_superuser=False)
        )

    def perform_destroy(self, instance):
        user_management_service.delete_user(self.request.user, instance)

    @action(detail=True, methods=["post"])
    def disable(self, request, *args, **kwargs):
        instance = user_management_service.update_user(
            request.user, self.get_object(), {"is_active": False}
        )
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"])
    def activate(self, request, *args, **kwargs):
        instance = user_management_service.update_user(
            request.user, self.get_object(), {"is_active": True}
        )
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ResetPasswordSerializer(
            data=request.data, context={"user": instance}
        )
        serializer.is_valid(raise_exception=True)
        user_management_service.update_user(
            request.user,
            instance,
            {"password": serializer.validated_data["new_password"]},
        )
        return Response({"detail": "Password reset successfully."})

    @action(
        detail=True,
        methods=["post"],
        url_path="send-reset-link",
        throttle_classes=[AdminEmailThrottle],
    )
    def send_reset_link(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_active or not instance.email:
            raise ValidationError(
                {"detail": "An active account with an email address is required."}
            )
        try:
            send_password_reset(instance)
        except (SMTPException, OSError) as exc:
            error = APIException(
                "The email service could not accept the message. Try again later."
            )
            error.status_code = 503
            raise error from exc
        record_event(
            "user.reset_link_sent",
            actor=request.user,
            target=instance.username,
            request=request,
        )
        return Response(
            {
                "detail": "The reset email was accepted by the email backend. Inbox delivery is not verified."
            }
        )
