import logging
import math
import secrets
from datetime import timedelta
from smtplib import SMTPException

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, Throttled, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from core.models import Project
from users.models import SignupChallenge, User
from users.serializers.auth import (
    SignupResendSerializer,
    SignupSerializer,
    SignupVerifySerializer,
)
from users.views.auth import authenticated_response

logger = logging.getLogger(__name__)


class SignupThrottle(AnonRateThrottle):
    def get_ident(self, request):
        return request.META["REMOTE_ADDR"]


class SignupBurstThrottle(SignupThrottle):
    scope = "signup_burst"


class SignupHourlyThrottle(SignupThrottle):
    scope = "signup_hourly"


class SignupVerifyThrottle(SignupThrottle):
    scope = "signup_verify"


class EmailDeliveryError(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = (
        "We could not send your verification email. Please try again shortly."
    )


def issue_code(challenge):
    now = timezone.now()
    code = f"{secrets.randbelow(1_000_000):06d}"
    challenge.code_hash = make_password(code)
    challenge.attempts = 0
    challenge.last_sent_at = now
    challenge.expires_at = now + timedelta(
        seconds=settings.SIGNUP_CODE_LIFETIME_SECONDS
    )
    challenge.save()
    try:
        send_mail(
            "Your BjeyFlow verification code",
            f"Your verification code is {code}.\n\nIt expires in 10 minutes. Do not share it with anyone.\nIf you did not request a BjeyFlow account, you can ignore this email.\n\nA little more flow,\nBjeyFlow",
            settings.DEFAULT_FROM_EMAIL,
            [challenge.email],
            fail_silently=False,
        )
    except (SMTPException, OSError) as exc:
        logger.exception("Signup email delivery failed")
        raise EmailDeliveryError() from exc


def challenge_response(challenge):
    return {
        "challenge_id": str(challenge.id),
        "email": challenge.email,
        "expires_at": challenge.expires_at.isoformat(),
        "resend_available_at": (
            challenge.last_sent_at + timedelta(seconds=settings.SIGNUP_RESEND_SECONDS)
        ).isoformat(),
        "delivery": "development_console"
        if settings.EMAIL_BACKEND == "django.core.mail.backends.console.EmailBackend"
        else "email",
    }


def check_cooldown(challenge):
    remaining = (
        settings.SIGNUP_RESEND_SECONDS
        - (timezone.now() - challenge.last_sent_at).total_seconds()
    )
    if remaining > 0:
        raise Throttled(
            wait=math.ceil(remaining),
            detail="Please wait before requesting another code.",
        )


class SignupView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [SignupBurstThrottle, SignupHourlyThrottle]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            with transaction.atomic():
                previous = (
                    SignupChallenge.objects.select_for_update()
                    .filter(email=data["email"])
                    .first()
                )
                if previous:
                    check_cooldown(previous)
                    previous.delete()
                SignupChallenge.objects.filter(expires_at__lt=timezone.now()).delete()
                challenge = SignupChallenge(
                    email=data["email"],
                    username=data["username"],
                    password_hash=make_password(data["password"]),
                    profile={
                        key: data[key]
                        for key in (
                            "first_name",
                            "last_name",
                            "flow_name",
                            "focus_style",
                            "north_star",
                            "workspace_name",
                        )
                    },
                )
                issue_code(challenge)
        except IntegrityError as exc:
            raise ValidationError(
                {
                    "email": "Another verification is already in progress. Please try again shortly."
                }
            ) from exc
        return Response(challenge_response(challenge), status=status.HTTP_201_CREATED)


class SignupResendView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [SignupBurstThrottle, SignupHourlyThrottle]

    def post(self, request):
        serializer = SignupResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            challenge = get_object_or_404(
                SignupChallenge.objects.select_for_update(),
                pk=serializer.validated_data["challenge_id"],
            )
            check_cooldown(challenge)
            issue_code(challenge)
        return Response(challenge_response(challenge))


class SignupVerifyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [SignupVerifyThrottle]

    def post(self, request):
        serializer = SignupVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        valid = False
        try:
            with transaction.atomic():
                challenge = get_object_or_404(
                    SignupChallenge.objects.select_for_update(),
                    pk=serializer.validated_data["challenge_id"],
                )
                if challenge.expires_at <= timezone.now():
                    raise ValidationError(
                        {"code": "This code has expired. Request a new one."}
                    )
                if challenge.attempts >= settings.SIGNUP_MAX_ATTEMPTS:
                    raise ValidationError(
                        {"code": "Too many attempts. Request a new code."}
                    )
                valid = check_password(
                    serializer.validated_data["code"], challenge.code_hash
                )
                if not valid:
                    challenge.attempts += 1
                    challenge.save(update_fields=["attempts"])
                else:
                    profile = challenge.profile.copy()
                    workspace_name = profile.pop("workspace_name")
                    user = User.objects.create(
                        username=challenge.username,
                        email=challenge.email,
                        password=challenge.password_hash,
                        display_name=f"{profile['first_name']} {profile['last_name']}"[
                            :150
                        ],
                        is_staff=False,
                        is_superuser=False,
                        **profile,
                    )
                    Project.objects.create(
                        owner=user, name=workspace_name, icon="folder"
                    )
                    challenge.delete()
        except IntegrityError as exc:
            raise ValidationError(
                {
                    "detail": "This username or email is no longer available. Please update your details or sign in."
                }
            ) from exc
        if not valid:
            raise ValidationError(
                {"code": "That code does not match. Check your email and try again."}
            )
        return authenticated_response(user)
