from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from administration.audit import record_event
from users.models import AccountSession, User
from users.serializers.auth import UserProfileSerializer
from users.serializers.settings import PreferencesSerializer, ProfileUpdateSerializer


class ProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        record_event("profile.updated", actor=request.user, request=request)
        return Response({"user": UserProfileSerializer(request.user).data})


class PreferencesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(request.user.preferences)

    @transaction.atomic
    def patch(self, request):
        serializer = PreferencesSerializer(
            data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = User.objects.select_for_update().get(pk=request.user.pk)
        user.preferences = {**user.preferences, **serializer.validated_data}
        user.save(update_fields=["preferences"])
        return Response(user.preferences)


class SessionsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        sessions = request.user.account_sessions.filter(
            revoked_at__isnull=True, expires_at__gt=timezone.now()
        )
        return Response(
            [
                {
                    "id": session.id,
                    "user_agent": session.user_agent,
                    "ip_address": session.ip_address,
                    "created_at": session.created_at,
                    "last_seen": session.last_seen,
                    "expires_at": session.expires_at,
                    "current": session.token_id == request.auth["jti"],
                }
                for session in sessions
            ]
        )

    def delete(self, request, session_id=None):
        sessions = AccountSession.objects.filter(
            user=request.user, revoked_at__isnull=True
        )
        if session_id is None:
            sessions.exclude(token_id=request.auth["jti"]).update(
                revoked_at=timezone.now()
            )
        else:
            session = get_object_or_404(sessions, pk=session_id)
            session.revoked_at = timezone.now()
            session.save(update_fields=["revoked_at"])
        record_event("sessions.revoked", actor=request.user, request=request)
        return Response(status=204)
