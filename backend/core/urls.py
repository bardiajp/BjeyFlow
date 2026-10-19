from __future__ import annotations

from rest_framework.routers import SimpleRouter

from core.views.project import ProjectViewSet
from core.views.subtask import SubTaskViewSet
from core.views.task import TaskViewSet

router = SimpleRouter(use_regex_path=False)
router.register("projects", ProjectViewSet, basename="project")
router.register("tasks", TaskViewSet, basename="task")
router.register("tasks/<uuid:task_pk>/subtasks", SubTaskViewSet, basename="subtask")

urlpatterns = router.urls
