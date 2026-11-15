from django.utils import timezone


def change_password(user, password: str) -> None:
    user.set_password(password)
    user.save(update_fields=["password"])
    user.account_sessions.filter(revoked_at__isnull=True).update(
        revoked_at=timezone.now()
    )
