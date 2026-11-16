from core.models import LeagueClock, Task, TaskXP, XPEvent
from math import isqrt


XP_BY_PRIORITY = {
    Task.Priority.LOW: 5,
    Task.Priority.NORMAL: 10,
    Task.Priority.HIGH: 15,
    Task.Priority.URGENT: 20,
}


def level_progress(total):
    level = (1 + isqrt(1 + (2 * total) // 25)) // 2
    start = 50 * level * (level - 1)
    return {
        "level": level,
        "level_xp": total - start,
        "level_required_xp": level * 100,
        "next_level_total_xp": start + level * 100,
    }


def sync_task_xp(task, owner):
    LeagueClock.objects.get_or_create(pk=1)
    LeagueClock.objects.select_for_update().get(pk=1)
    active = task.status == Task.Status.COMPLETED and task.deleted_at is None
    award = TaskXP.objects.filter(task=task).first()
    if award is None and active:
        award = TaskXP.objects.create(owner=owner, task=task, priority=task.priority, amount=XP_BY_PRIORITY[task.priority])
        XPEvent.objects.create(award=award, delta=award.amount)
    elif award is not None and award.active != active:
        award.active = active
        award.save(update_fields=["active", "updated_at"])
        XPEvent.objects.create(award=award, delta=award.amount if active else -award.amount)
