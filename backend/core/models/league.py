from django.conf import settings
from django.db import models

from .base import BaseModel


class LeagueClock(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)


class LeagueMembership(BaseModel):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="league_membership")
    is_active = models.BooleanField(default=True)
    tier = models.PositiveSmallIntegerField(default=0)
    public_name = models.CharField(max_length=50)


class LeagueWeek(BaseModel):
    start = models.DateTimeField(unique=True)
    closed_at = models.DateTimeField(null=True, blank=True)


class LeagueGroup(BaseModel):
    week = models.ForeignKey(LeagueWeek, on_delete=models.CASCADE, related_name="groups")
    tier = models.PositiveSmallIntegerField()


class LeagueEntry(BaseModel):
    group = models.ForeignKey(LeagueGroup, on_delete=models.CASCADE, related_name="entries")
    membership = models.ForeignKey(LeagueMembership, on_delete=models.CASCADE, related_name="entries")
    eligible_from = models.DateTimeField()
    score = models.PositiveIntegerField(null=True, blank=True)
    rank = models.PositiveIntegerField(null=True, blank=True)
    outcome = models.CharField(max_length=12, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["group", "membership"], name="league_group_member_unique")]
