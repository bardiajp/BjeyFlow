import json
import shutil
import smtplib
import ssl
from pathlib import Path

from django.conf import settings
from django.core.cache import cache
from django.db import DatabaseError, connection


def cache_health():
    if not settings.REDIS_URL:
        return "local_memory"
    from redis.exceptions import RedisError

    try:
        cache.set("administration:health", "ok", 10)
        return (
            "healthy" if cache.get("administration:health") == "ok" else "unavailable"
        )
    except (RedisError, OSError):
        return "unavailable"


def service_status():
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        database = "healthy"
    except DatabaseError:
        database = "unavailable"
    cache_status = cache_health()
    if settings.EMAIL_BACKEND != "django.core.mail.backends.smtp.EmailBackend":
        email = "development" if settings.DEBUG else "custom_backend"
    else:
        try:
            client_type = smtplib.SMTP_SSL if settings.EMAIL_USE_SSL else smtplib.SMTP
            options = (
                {"context": ssl.create_default_context()}
                if settings.EMAIL_USE_SSL
                else {}
            )
            with client_type(
                settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=5, **options
            ) as smtp:
                smtp.ehlo()
                if settings.EMAIL_USE_TLS:
                    smtp.starttls(context=ssl.create_default_context())
                    smtp.ehlo()
                if settings.EMAIL_HOST_USER:
                    smtp.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            email = "healthy"
        except (smtplib.SMTPException, OSError):
            email = "unavailable"
    disk = shutil.disk_usage(settings.BASE_DIR)
    backup = None
    if settings.BACKUP_STATUS_FILE:
        try:
            backup = json.loads(Path(settings.BACKUP_STATUS_FILE).read_text())
        except FileNotFoundError:
            backup = None
    return {
        "database": database,
        "cache": cache_status,
        "email": email,
        "disk": {
            "total_bytes": disk.total,
            "used_bytes": disk.used,
            "free_bytes": disk.free,
        },
        "last_backup": backup,
    }
