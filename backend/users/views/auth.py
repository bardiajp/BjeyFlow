from __future__ import annotations

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from users.auth import change_password
from users.serializers.auth import (
    ChangePasswordSerializer,
    LoginSerializer,
    UserProfileSerializer,
)


def authenticated_response(user, remember_me=True):
    refresh = RefreshToken.for_user(user)
    response = Response(
        {"user": UserProfileSerializer(user).data}, status=status.HTTP_200_OK
    )
    response.set_cookie(
        settings.JWT_COOKIE_NAME,
        str(refresh.access_token),
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

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return authenticated_response(serializer.user, serializer.remember_me)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        response = Response({"detail": "Logged out"})
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
        return Response({"detail": "Password changed successfully."})


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response({"user": UserProfileSerializer(request.user).data})
