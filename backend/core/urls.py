from __future__ import annotations

from rest_framework.routers import SimpleRouter
from django.urls import path

from core.views.project import ProjectViewSet
from core.views.subtask import SubTaskViewSet
from core.views.task import TaskViewSet
from core.views.weather import WeatherView

router = SimpleRouter(use_regex_path=False)
router.register("projects", ProjectViewSet, basename="project")
router.register("tasks", TaskViewSet, basename="task")
router.register("tasks/<uuid:task_pk>/subtasks", SubTaskViewSet, basename="subtask")

urlpatterns = [path("weather/", WeatherView.as_view(), name="weather")] + router.urls
