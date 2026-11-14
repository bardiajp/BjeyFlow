from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from core.models import Project, Task


class CreateTaskChecklistTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="checklist-test")
        cls.project = Project.objects.create(owner=cls.user, name="Checklist project")

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def create_task(self, subtasks):
        return self.client.post(
            "/api/tasks/",
            {
                "title": "Task with a draft checklist",
                "project": str(self.project.pk),
                "subtasks": subtasks,
            },
            format="json",
        )

    def test_create_preserves_checklist_order_and_completion(self):
        response = self.create_task(
            [
                {
                    "title": "Second step moved first",
                    "position": 0,
                    "is_completed": True,
                },
                {
                    "title": "First step moved second",
                    "position": 1,
                    "is_completed": False,
                },
            ]
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["subtasks_count"], 2)
        self.assertEqual(response.data["completed_subtasks_count"], 1)
        task = Task.objects.get(pk=response.data["id"])
        self.assertEqual(
            list(task.subtasks.values_list("title", "position", "is_completed")),
            [
                ("Second step moved first", 0, True),
                ("First step moved second", 1, False),
            ],
        )

    def test_legacy_subtasks_default_to_unchecked(self):
        response = self.create_task([{"title": "New step", "position": 0}])
        self.assertEqual(response.status_code, 201, response.data)
        self.assertFalse(response.data["subtasks"][0]["is_completed"])

    def test_empty_checklist_is_optional(self):
        response = self.create_task([])
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["subtasks_count"], 0)

    def test_invalid_checklist_does_not_create_partial_task(self):
        response = self.create_task([{"title": "   ", "is_completed": False}])
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Task.objects.exists())
