from __future__ import annotations

from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken

from users.models import User


class JWTCookieAuthentication(BaseAuthentication):
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

        return (user, payload)
