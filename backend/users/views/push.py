import base64
import binascii
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from cryptography.hazmat.primitives.asymmetric import ec
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from users.models import AccountSession, PushSubscription
from users.services.push import push_configured, send_push


class PushThrottle(UserRateThrottle):
    scope = "push"
    rate = "20/hour"


class SubscriptionSerializer(serializers.Serializer):
    endpoint = serializers.URLField(max_length=2048)
    p256dh = serializers.CharField(max_length=128)
    auth = serializers.CharField(max_length=128)
    time_zone = serializers.CharField(max_length=100)

    def validate_endpoint(self, value):
        parsed = urlsplit(value)
        host = parsed.hostname or ""
        allowed = host in {
            "fcm.googleapis.com",
            "updates.push.services.mozilla.com",
            "push.services.mozilla.com",
        } or host.endswith(".push.apple.com")
        if (
            parsed.scheme != "https"
            or not allowed
            or parsed.username
            or parsed.password
            or parsed.port not in (None, 443)
        ):
            raise serializers.ValidationError("Unsupported push service endpoint.")
        return value

    def validate(self, attrs):
        for name, size in (("p256dh", 65), ("auth", 16)):
            value = attrs[name]
            try:
                raw = base64.b64decode(
                    value + "=" * (-len(value) % 4), altchars=b"-_", validate=True
                )
            except (ValueError, binascii.Error) as error:
                raise serializers.ValidationError(
                    {name: "Invalid push key."}
                ) from error
            if len(raw) != size or (name == "p256dh" and raw[0] != 4):
                raise serializers.ValidationError({name: "Invalid push key."})
            if name == "p256dh":
                try:
                    ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), raw)
                except ValueError as error:
                    raise serializers.ValidationError(
                        {name: "Invalid push key."}
                    ) from error
        try:
            ZoneInfo(attrs["time_zone"])
        except ZoneInfoNotFoundError as error:
            raise serializers.ValidationError(
                {"time_zone": "Invalid time zone."}
            ) from error
        return attrs


class PushConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.conf import settings

        return Response(
            {
                "configured": push_configured(),
                "public_key": settings.VAPID_PUBLIC_KEY if push_configured() else "",
            }
        )


class PushSubscriptionsView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PushThrottle]

    def get(self, request):
        return Response(
            list(
                PushSubscription.objects.filter(
                    user=request.user,
                    session__revoked_at__isnull=True,
                    session__expires_at__gt=timezone.now(),
                ).values_list("endpoint", flat=True)
            )
        )

    def post(self, request):
        if not push_configured():
            return Response(
                {"detail": "Push notifications are not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        serializer = SubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        session = AccountSession.objects.get(
            user=request.user,
            token_id=request.auth["jti"],
            revoked_at__isnull=True,
            expires_at__gt=timezone.now(),
        )
        subscription, _ = PushSubscription.objects.update_or_create(
            endpoint=values["endpoint"],
            defaults={
                "user": request.user,
                "session": session,
                "p256dh": values["p256dh"],
                "auth": values["auth"],
                "time_zone": values["time_zone"],
                "user_agent": request.headers.get("User-Agent", "")[:512],
            },
        )
        return Response({"id": subscription.id}, status=status.HTTP_200_OK)

    def delete(self, request):
        endpoint = request.data.get("endpoint", "")
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PushTestView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PushThrottle]

    def post(self, request):
        subscription = PushSubscription.objects.filter(
            user=request.user,
            endpoint=request.data.get("endpoint", ""),
            session__revoked_at__isnull=True,
            session__expires_at__gt=timezone.now(),
        ).first()
        if not subscription:
            return Response(
                {"detail": "Enable notifications on this device first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not push_configured():
            return Response(
                {"detail": "Push notifications are not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not send_push(subscription, "test", "/settings", ttl=60):
            return Response(
                {"detail": "This subscription expired. Enable notifications again."},
                status=status.HTTP_410_GONE,
            )
        return Response({"detail": "Test notification accepted by the push service."})
