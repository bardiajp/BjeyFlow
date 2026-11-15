from core.utils.ip import get_ip
from .models import AuditEvent


def record_event(action, *, actor=None, target="", request=None, metadata=None):
    return AuditEvent.objects.create(
        actor=actor,
        actor_name=actor.username if actor else "",
        action=action,
        target=str(target)[:150],
        ip_address=get_ip(request) if request else None,
        metadata=metadata if metadata is not None else {},
    )
