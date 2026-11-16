from datetime import datetime, time, timezone

from django.db.models import Sum
from django.utils import timezone as django_timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import LeagueEntry, TaskXP, XPEvent
from core.services.league import DAILY_CAP, advance_leagues, score_entry_by_day
from core.services.xp import level_progress


class XPSummaryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        awards = TaskXP.objects.filter(owner=request.user, active=True)
        now = django_timezone.now()
        start = datetime.combine(now.astimezone(timezone.utc).date(), time.min, tzinfo=timezone.utc)
        total = awards.aggregate(total=Sum("amount"))["total"] or 0
        today = awards.filter(created_at__gte=start).aggregate(total=Sum("amount"))["total"] or 0
        week = advance_leagues()
        entry = LeagueEntry.objects.filter(group__week=week, membership__owner=request.user, membership__is_active=True).select_related("membership__owner").first()
        eligible = score_entry_by_day(entry, now)[0].get(start.date(), 0) if entry else 0
        events = XPEvent.objects.filter(award__owner=request.user).select_related("award__task").order_by("-created_at")[:20]
        history = [{"id": event.id, "delta": event.delta, "created_at": event.created_at, "priority": event.award.priority, "task": event.award.task.title if event.award.task else None} for event in events]
        return Response({"total_xp": total, **level_progress(total), "today_xp": today, "today_league_eligible_xp": eligible, "daily_league_cap": DAILY_CAP, "timezone": "UTC", "history": history})
