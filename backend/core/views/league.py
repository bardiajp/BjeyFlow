from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import LeagueEntry, LeagueMembership, TaskXP
from core.services.league import TIERS, advance_leagues, standings
from core.services.xp import level_progress


class LeagueJoinSerializer(serializers.Serializer):
    public_name = serializers.CharField(max_length=50, trim_whitespace=True)


class LeagueView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        week = advance_leagues()
        membership = LeagueMembership.objects.filter(owner=request.user).first()
        if membership is None or not membership.is_active:
            return Response({"joined": False, "tiers": TIERS})
        entry = LeagueEntry.objects.filter(group__week=week, membership=membership).select_related("group").first()
        if entry is None:
            return Response({"joined": True, "tier": TIERS[membership.tier], "standings": [], "starts_at": week.start, "ends_at": week.start + timedelta(days=7)})
        rows = standings(entry.group, timezone.now())
        totals = dict(TaskXP.objects.filter(owner_id__in=[item.membership.owner_id for item, _, _ in rows], active=True).values_list("owner_id").annotate(total=Sum("amount")))
        previous = (LeagueEntry.objects.filter(membership=membership, group__week__closed_at__isnull=False, score__isnull=False)
            .select_related("group__week").order_by("-group__week__start").first())
        return Response({
            "joined": True, "public_name": membership.public_name,
            "tier": TIERS[entry.group.tier], "starts_at": week.start,
            "ends_at": week.start + timedelta(days=7),
            "standings": [{"rank": index + 1, "name": item.membership.public_name, "score": score, "level": level_progress(totals.get(item.membership.owner_id, 0))["level"], "is_me": item.membership_id == membership.id} for index, (item, score, _) in enumerate(rows)],
            "previous": {"tier": TIERS[previous.group.tier], "rank": previous.rank, "score": previous.score, "outcome": previous.outcome} if previous else None,
        })

    def post(self, request):
        serializer = LeagueJoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        advance_leagues(owner=request.user, active=True, public_name=serializer.validated_data["public_name"])
        return self.get(request)

    def delete(self, request):
        advance_leagues(owner=request.user, active=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
