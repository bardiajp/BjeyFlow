from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from core.models import Project, Task


User = get_user_model()
PASSWORD = "A-strong-password-483!"


class AccountManagementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="owner", password=PASSWORD)
        self.user = User.objects.create_user(username="member", password=PASSWORD)

    def test_transfer_changes_both_roles(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(f"/users/{self.user.pk}/transfer-superuser/")
        self.assertEqual(response.status_code, 200, response.data)
        self.admin.refresh_from_db()
        self.user.refresh_from_db()
        self.assertFalse(self.admin.is_superuser)
        self.assertTrue(self.admin.is_staff)
        self.assertTrue(self.user.is_superuser)

    def test_non_superuser_cannot_transfer(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(f"/users/{self.user.pk}/transfer-superuser/")
        self.assertEqual(response.status_code, 403)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_superuser)

    def test_transfer_rejects_inactive_target(self):
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        self.client.force_authenticate(self.admin)
        response = self.client.post(f"/users/{self.user.pk}/transfer-superuser/")
        self.assertEqual(response.status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_superuser)

    def test_delete_account_removes_owned_data(self):
        project = Project.objects.create(owner=self.user, name="My Project")
        task = Task.objects.create(project=project, title="A task")
        self.client.force_authenticate(self.user)
        response = self.client.delete("/users/auth/me/", {"password": PASSWORD}, format="json")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())
        self.assertFalse(Project.objects.filter(pk=project.pk).exists())
        self.assertFalse(Task.objects.filter(pk=task.pk).exists())
        self.assertTrue(User.objects.filter(pk=self.admin.pk).exists())

    def test_delete_requires_correct_password(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete("/users/auth/me/", {"password": "wrong"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_last_superuser_cannot_delete_account(self):
        self.client.force_authenticate(self.admin)
        response = self.client.delete("/users/auth/me/", {"password": PASSWORD}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.admin.pk).exists())
