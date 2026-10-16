from __future__ import annotations

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from users.serializers.auth import LoginSerializer


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user
        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "display_name": user.display_name,
                },
            },
            status=status.HTTP_200_OK,
        )
        response.set_cookie(
            settings.JWT_COOKIE_NAME,
            str(refresh.access_token),
            httponly=True,
            secure=settings.JWT_COOKIE_SECURE,
            samesite="Lax",
            max_age=settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS,
            path="/",
        )
        return response


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        response = Response({"detail": "Logged out"})
        response.delete_cookie(settings.JWT_COOKIE_NAME, path="/")
        return response


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(
            {
                "user": {
                    "id": str(request.user.id),
                    "email": request.user.email,
                    "display_name": request.user.display_name,
                },
            }
        )
