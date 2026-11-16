from datetime import timedelta, timezone as utc

from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone

from core.models import LeagueClock, LeagueEntry, LeagueGroup, LeagueMembership, LeagueWeek, TaskXP

TIERS = ("Spark", "Rise", "Flow", "Momentum", "Orbit")
GROUP_SIZE = 25
DAILY_CAP = 100


def week_start(now):
    day = now.astimezone(utc.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return day - timedelta(days=day.weekday())


def score_entry_by_day(entry, cutoff):
    awards = (TaskXP.objects.filter(owner=entry.membership.owner, created_at__gte=entry.eligible_from, created_at__lt=cutoff)
        .annotate(balance=Sum("events__delta", filter=models_before(cutoff)))
        .order_by("created_at", "id"))
    daily = {}
    reached = entry.eligible_from
    for award in awards:
        if not award.balance or award.balance <= 0:
            continue
        day = award.created_at.astimezone(utc.utc).date()
        old = daily.get(day, 0)
        daily[day] = min(DAILY_CAP, old + award.amount)
        if daily[day] > old:
            reached = award.created_at
    return daily, reached


def score_entry(entry, cutoff):
    daily, reached = score_entry_by_day(entry, cutoff)
    return sum(daily.values()), reached


def models_before(cutoff):
    from django.db.models import Q
    return Q(events__created_at__lt=cutoff)


def standings(group, cutoff):
    rows = []
    for entry in group.entries.filter(membership__is_active=True).select_related("membership__owner"):
        score, reached = score_entry(entry, cutoff)
        rows.append((entry, score, reached))
    return sorted(rows, key=lambda row: (-row[1], row[2], str(row[0].id)))


def assign(week, membership, eligible_from):
    existing = LeagueEntry.objects.filter(group__week=week, membership=membership).first()
    if existing:
        return existing
    group = (week.groups.filter(tier=membership.tier).annotate(n=Count("entries"))
        .filter(n__lt=GROUP_SIZE).order_by("created_at", "id").first())
    if group is None:
        group = LeagueGroup.objects.create(week=week, tier=membership.tier)
    return LeagueEntry.objects.create(group=group, membership=membership, eligible_from=eligible_from)


def close_week(week):
    cutoff = week.start + timedelta(days=7)
    for group in week.groups.all():
        rows = standings(group, cutoff)
        active = sum(score > 0 for _, score, _ in rows)
        slots = max(1, active // 5) if active >= 5 else 0
        for index, (entry, score, _) in enumerate(rows):
            outcome = "stay"
            if score > 0 and slots and index < slots and group.tier < len(TIERS) - 1:
                entry.membership.tier = group.tier + 1
                outcome = "promoted"
            elif score > 0 and active >= 10 and index >= active - slots and group.tier > 0:
                entry.membership.tier = group.tier - 1
                outcome = "demoted"
            entry.membership.save(update_fields=["tier", "updated_at"])
            entry.score, entry.rank, entry.outcome = score, index + 1, outcome
            entry.save(update_fields=["score", "rank", "outcome", "updated_at"])
    week.closed_at = timezone.now()
    week.save(update_fields=["closed_at", "updated_at"])


@transaction.atomic
def advance_leagues(now=None, owner=None, active=None, public_name=None):
    LeagueClock.objects.get_or_create(pk=1)
    LeagueClock.objects.select_for_update().get(pk=1)
    now = now or timezone.now()
    current = week_start(now)
    week = LeagueWeek.objects.order_by("-start").first()
    if week is None:
        week = LeagueWeek.objects.create(start=current)
    while week.start < current:
        if week.closed_at is None:
            close_week(week)
        week, created = LeagueWeek.objects.get_or_create(start=week.start + timedelta(days=7))
        if created:
            for membership in LeagueMembership.objects.filter(is_active=True).order_by("created_at", "id"):
                assign(week, membership, week.start)
    if owner is not None and active is not None:
        membership = LeagueMembership.objects.filter(owner=owner).first()
        if membership is None and active:
            membership = LeagueMembership.objects.create(owner=owner, public_name=public_name)
        elif membership is not None:
            was_active = membership.is_active
            membership.is_active = active
            if active:
                membership.public_name = public_name
            membership.save(update_fields=["is_active", "public_name", "updated_at"])
            if active and not was_active:
                LeagueEntry.objects.filter(group__week=week, membership=membership).update(eligible_from=now)
        if membership and active:
            assign(week, membership, now)
    return week
