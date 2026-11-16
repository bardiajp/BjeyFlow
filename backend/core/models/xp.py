from django.conf import settings
from django.db import models

from .base import BaseModel


class TaskXP(BaseModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_xp")
    task = models.OneToOneField("core.Task", on_delete=models.SET_NULL, null=True, related_name="xp_award")
    priority = models.CharField(max_length=10)
    amount = models.PositiveIntegerField()
    active = models.BooleanField(default=True)


class XPEvent(BaseModel):
    award = models.ForeignKey(TaskXP, on_delete=models.CASCADE, related_name="events")
    delta = models.SmallIntegerField()
