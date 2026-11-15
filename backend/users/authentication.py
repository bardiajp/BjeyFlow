from __future__ import annotations

from django.conf import settings
from datetime import datetime, timezone as datetime_timezone, timedelta
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.utils import get_md5_hash_password

from users.models import AccountSession, User
from core.utils.ip import get_ip


class JWTCookieAuthentication(BaseAuthentication):
    def authenticate_header(self, request):
        return "Bearer"

    def authenticate(self, request):
        token = request.COOKIES.get(settings.JWT_COOKIE_NAME)
        if not token:
            return None

        try:
            payload = AccessToken(token)
        except Exception as err:
            raise AuthenticationFailed("Invalid or expired token") from err

        try:
            user = User.objects.get(id=payload["user_id"])
        except User.DoesNotExist as err:
            raise AuthenticationFailed("User not found") from err

        if not user.is_active:
            raise AuthenticationFailed("User is inactive")

        if payload.get(api_settings.REVOKE_TOKEN_CLAIM) != get_md5_hash_password(
            user.password
        ):
            raise AuthenticationFailed("Password changed. Please sign in again.")

        session, _ = AccountSession.objects.get_or_create(
            token_id=payload["jti"],
            defaults={
                "user": user,
                "user_agent": request.headers.get("User-Agent", "")[:512],
                "ip_address": get_ip(request),
                "expires_at": datetime.fromtimestamp(
                    payload["exp"], tz=datetime_timezone.utc
                ),
            },
        )
        if session.revoked_at is not None:
            raise AuthenticationFailed("This session has been signed out.")
        if session.last_seen < timezone.now() - timedelta(minutes=5):
            AccountSession.objects.filter(pk=session.pk).update(
                last_seen=timezone.now()
            )
        return (user, payload)
