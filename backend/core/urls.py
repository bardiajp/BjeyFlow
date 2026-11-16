from __future__ import annotations

from rest_framework.routers import SimpleRouter
from django.urls import path

from core.views.project import ProjectViewSet
from core.views.goal import GoalViewSet, MilestoneViewSet
from core.views.subtask import SubTaskViewSet
from core.views.task import TaskViewSet
from core.views.weather import WeatherView
from core.views.xp import XPSummaryView
from core.views.league import LeagueView
from core.views.desktop import DesktopReleaseView

router = SimpleRouter(use_regex_path=False)
router.register("projects", ProjectViewSet, basename="project")
router.register("goals", GoalViewSet, basename="goal")
router.register("milestones", MilestoneViewSet, basename="milestone")
router.register("tasks", TaskViewSet, basename="task")
router.register("tasks/<uuid:task_pk>/subtasks", SubTaskViewSet, basename="subtask")

urlpatterns = [
    path("weather/", WeatherView.as_view(), name="weather"),
    path("xp/", XPSummaryView.as_view(), name="xp-summary"),
    path("league/", LeagueView.as_view(), name="league"),
    path("desktop/releases/", DesktopReleaseView.as_view(), name="desktop-releases"),
] + router.urls
