from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import jwt
from django.conf import settings


def create_access_token(user, workspace_id: str | None = None) -> str:
    now = datetime.now(UTC)
    payload: dict = {
        "sub": str(user.id),
        "email": user.email,
        "exp": now + timedelta(seconds=settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS),
        "iat": now,
        "jti": str(uuid.uuid4()),
    }
    if workspace_id:
        payload["wid"] = str(workspace_id)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
