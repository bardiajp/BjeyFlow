from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string

from .email import send_account_email


def send_password_reset(user):
    token = default_token_generator.make_token(user)
    context = {
        "reset_url": f"{settings.APP_URL}/reset-password#uid={user.pk}&token={token}",
        "expiry_minutes": settings.PASSWORD_RESET_TIMEOUT // 60,
    }
    return send_account_email(
        "password_reset",
        "A fresh start for your BjeyFlow password",
        render_to_string("users/emails/password_reset.txt", context),
        user.email,
        render_to_string("users/emails/password_reset.html", context),
    )
