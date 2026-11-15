from __future__ import annotations

from datetime import timedelta
from ipaddress import ip_address
from pathlib import Path

import environ
from django.core.exceptions import ImproperlyConfigured

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CSRF_TRUSTED_ORIGINS=(list, []),
    JWT_ACCESS_TOKEN_LIFETIME_SECONDS=(int, 3600),
)

BASE_DIR = Path(__file__).resolve().parent.parent

environ.Env.read_env(BASE_DIR.parent / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="unsafe-development-key-change-me")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")
if not DEBUG and SECRET_KEY == "unsafe-development-key-change-me":
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY before starting production.")

TRUST_PROXY = env.bool("TRUST_PROXY", default=False)
if TRUST_PROXY:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=not DEBUG)
SECURE_REDIRECT_EXEMPT = [r"^healthz/$"]
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0

TIME_ZONE = "Asia/Tehran"
LANGUAGE_CODE = "en"
USE_I18N = True
USE_TZ = True

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "django.forms",
]

THIRD_PARTY_APPS = [
    "corsheaders",
    "django_filters",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
]

LOCAL_APPS = ["users", "core", "administration"]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", default=""),
        "USER": env("POSTGRES_USER", default=""),
        "PASSWORD": env("POSTGRES_PASSWORD", default=""),
        "HOST": env("POSTGRES_HOST", default=""),
        "PORT": env("POSTGRES_PORT", default=""),
        "CONN_MAX_AGE": 60,
        "CONN_HEALTH_CHECKS": True,
    }
}

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        if DEBUG
        else "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS", default=["http://localhost:5174", "http://127.0.0.1:5174"]
)
CORS_ALLOW_CREDENTIALS = True

REDIS_URL = env("REDIS_URL", default="")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.authentication.JWTCookieAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024

AUTH_USER_MODEL = "users.User"
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

JWT_SECRET_KEY = env("JWT_SECRET_KEY", default=SECRET_KEY)
JWT_ACCESS_TOKEN_LIFETIME_SECONDS = env("JWT_ACCESS_TOKEN_LIFETIME_SECONDS")
WEATHER_TRUSTED_PROXIES = env.list("WEATHER_TRUSTED_PROXIES", default=[])
WEATHER_DEV_IP = env("WEATHER_DEV_IP", default="").strip() if DEBUG else ""
if WEATHER_DEV_IP:
    try:
        address = ip_address(WEATHER_DEV_IP)
        address = getattr(address, "ipv4_mapped", None) or address
        if not address.is_global:
            raise ValueError("A public IP is required")
        WEATHER_DEV_IP = str(address)
    except ValueError as exc:
        raise ImproperlyConfigured(
            "WEATHER_DEV_IP must be a valid public IP address."
        ) from exc
WEATHER_CACHE_SECONDS = 600
WEATHER_REQUEST_TIMEOUT = 4
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "weather": "30/min",
    "signup_burst": "5/min",
    "signup_hourly": "20/hour",
    "signup_verify": "30/min",
}
JWT_COOKIE_NAME = "bf_access"
JWT_COOKIE_SECURE = not DEBUG
APP_URL = env(
    "APP_URL", default="http://localhost:5174" if DEBUG else "https://bjeyflow.space"
).rstrip("/")
PASSWORD_RESET_TIMEOUT = 1800
BACKUP_STATUS_FILE = env("BACKUP_STATUS_FILE", default="")
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"].update(
    {
        "password_reset": "5/hour",
        "password_reset_confirm": "20/min",
        "admin_health": "10/min",
        "admin_email": "30/hour",
        "login": "10/min",
        "login_hourly": "100/hour",
    }
)

EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend"
    if DEBUG
    else "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_TIMEOUT = 10
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="BjeyFlow <noreply@localhost>")
SIGNUP_CODE_LIFETIME_SECONDS = 600
SIGNUP_RESEND_SECONDS = 60
SIGNUP_MAX_ATTEMPTS = 5

SIMPLE_JWT = {
    "CHECK_REVOKE_TOKEN": True,
    "ACCESS_TOKEN_LIFETIME": timedelta(seconds=JWT_ACCESS_TOKEN_LIFETIME_SECONDS),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "SIGNING_KEY": JWT_SECRET_KEY,
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "TOKEN_OBTAIN_SERIALIZER": "users.serializers.auth.LoginSerializer",
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
        "admin_events": {
            "class": "administration.logging.AdministrationErrorHandler",
            "level": "ERROR",
        },
    },
    "root": {"handlers": ["console", "admin_events"], "level": "WARNING"},
}
