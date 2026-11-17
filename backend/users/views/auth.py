from __future__ import annotations
from datetime import datetime, timezone as datetime_timezone

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from users.auth import change_password
from administration.audit import record_event
from users.serializers.auth import (
    ChangePasswordSerializer,
    LoginSerializer,
    UserProfileSerializer,
)
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from core.utils.ip import get_ip
from users.models import AccountSession
from users.services.management import user_management_service


class LoginBurstThrottle(AnonRateThrottle):
    scope = "login"

    def get_ident(self, request):
        return get_ip(request)


class LoginHourlyThrottle(LoginBurstThrottle):
    scope = "login_hourly"


class DeleteAccountThrottle(UserRateThrottle):
    rate = "5/min"


def authenticated_response(user, request, remember_me=True):
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    AccountSession.objects.create(
        user=user,
        token_id=access["jti"],
        user_agent=request.headers.get("User-Agent", "")[:512],
        ip_address=get_ip(request),
        expires_at=datetime.fromtimestamp(access["exp"], tz=datetime_timezone.utc),
    )
    response = Response(
        {"user": UserProfileSerializer(user).data}, status=status.HTTP_200_OK
    )
    response.set_cookie(
        settings.JWT_COOKIE_NAME,
        str(access),
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite="Lax",
        max_age=settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS if remember_me else None,
        path="/",
    )
    return response


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginBurstThrottle, LoginHourlyThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except (AuthenticationFailed, ValidationError):
            username = (
                request.data.get("username", "")
                if isinstance(request.data, dict)
                else ""
            )
            record_event(
                "login.failed",
                target=username[:150] if isinstance(username, str) else "",
                request=request,
            )
            raise
        serializer.user.last_login = timezone.now()
        serializer.user.save(update_fields=["last_login"])
        record_event("login.succeeded", actor=serializer.user, request=request)
        return authenticated_response(serializer.user, request, serializer.remember_me)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        response = Response({"detail": "Logged out"})
        request.user.account_sessions.filter(token_id=request.auth["jti"]).update(
            revoked_at=timezone.now()
        )
        record_event("logout", actor=request.user, request=request)
        response.delete_cookie(settings.JWT_COOKIE_NAME, path="/")
        return response


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        change_password(request.user, serializer.validated_data["new_password"])
        record_event("password.changed", actor=request.user, request=request)
        return Response({"detail": "Password changed successfully."})


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_throttles(self):
        if self.request.method == "DELETE":
            return [DeleteAccountThrottle()]
        return super().get_throttles()

    def get(self, request):
        return Response({"user": UserProfileSerializer(request.user).data})

    def delete(self, request):
        password = request.data.get("password")
        if not isinstance(password, str) or not password:
            raise ValidationError({"password": "This field is required."})
        user_management_service.delete_own_account(request.user, password)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(settings.JWT_COOKIE_NAME, path="/")
        return response
