import hashlib
import logging
from smtplib import SMTPException

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from core.utils.ip import get_ip
from administration.audit import record_event
from users.auth import change_password
from users.models import User
from users.services.password_reset import send_password_reset
from users.serializers.password_reset import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)

logger = logging.getLogger(__name__)


class PasswordResetThrottle(AnonRateThrottle):
    scope = "password_reset"

    def get_ident(self, request):
        return get_ip(request)


class PasswordResetConfirmThrottle(PasswordResetThrottle):
    scope = "password_reset_confirm"


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        response = Response(
            {
                "detail": "If an active account uses this email, a password reset link will arrive shortly."
            }
        )
        key = "password-reset:" + hashlib.sha256(email.encode()).hexdigest()
        if not cache.add(key, True, timeout=60):
            return response
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is None or not user.has_usable_password():
            return response
        try:
            send_password_reset(user)
        except (SMTPException, OSError):
            logger.exception("Password reset email delivery failed")
        return response


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [PasswordResetConfirmThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            user = (
                User.objects.select_for_update()
                .filter(pk=data["uid"], is_active=True)
                .first()
            )
            if user is None or not default_token_generator.check_token(
                user, data["token"]
            ):
                raise ValidationError(
                    {
                        "detail": "This reset link is invalid or has expired. Request a new one."
                    }
                )
            try:
                validate_password(data["new_password"], user=user)
            except DjangoValidationError as exc:
                raise ValidationError({"new_password": exc.messages}) from exc
            change_password(user, data["new_password"])
            record_event("password.recovered", actor=user, request=request)
        response = Response(
            {"detail": "Password updated. Sign in with your new password."}
        )
        response.delete_cookie(settings.JWT_COOKIE_NAME, path="/")
        return response
