from smtplib import SMTPException

from django.conf import settings
from django.core.mail import send_mail

from administration.models import EmailEvent


def send_account_email(kind, subject, message, recipient, html_message):
    try:
        sent = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            html_message=html_message,
            fail_silently=False,
        )
        if sent != 1:
            raise SMTPException("Email backend did not accept the message.")
    except (SMTPException, OSError) as exc:
        EmailEvent.objects.create(
            kind=kind,
            recipient=recipient,
            status="failed",
            backend=settings.EMAIL_BACKEND,
            error_type=type(exc).__name__,
        )
        raise
    EmailEvent.objects.create(
        kind=kind,
        recipient=recipient,
        status="accepted" if sent else "failed",
        backend=settings.EMAIL_BACKEND,
    )
    return sent
