from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import FeatureRecommendation


class RecommendationTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="idea-user")
        cls.staff = get_user_model().objects.create_user(username="idea-admin", is_staff=True)

    def setUp(self):
        cache.clear()
        self.client.force_authenticate(self.user)

    def submit(self, **overrides):
        return self.client.post("/users/auth/recommendations/", {
            "title": "  Faster task entry  ",
            "description": "  A keyboard shortcut would help me add tasks.  ",
            **overrides,
        }, format="json")

    def test_submission_is_saved_and_attributed_to_authenticated_user(self):
        response = self.submit(user=str(self.staff.pk), username="somebody-else")
        self.assertEqual(response.status_code, 201)
        item = FeatureRecommendation.objects.get()
        self.assertEqual(item.user, self.user)
        self.assertEqual(item.title, "Faster task entry")
        self.assertEqual(response.data["username"], self.user.username)

    def test_blank_and_oversized_input_is_rejected(self):
        for values in (
            {"title": " "}, {"description": "\n "},
            {"title": "a" * 161}, {"description": "a" * 2001},
        ):
            with self.subTest(values=values):
                self.assertEqual(self.submit(**values).status_code, 400)
        self.assertEqual(FeatureRecommendation.objects.count(), 0)

    def test_login_required(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.submit().status_code, 401)

    def test_users_cannot_list_submissions_or_access_admin_inbox(self):
        self.assertEqual(self.client.get("/users/auth/recommendations/").status_code, 405)
        self.assertEqual(self.client.get("/api/admin/recommendations/").status_code, 403)

    def test_staff_can_read_search_and_paginate(self):
        FeatureRecommendation.objects.bulk_create([
            FeatureRecommendation(user=self.user, title=f"Idea {number}", description="Useful")
            for number in range(21)
        ])
        self.client.force_authenticate(self.staff)
        response = self.client.get("/api/admin/recommendations/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 21)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertIsNotNone(response.data["next"])
        response = self.client.get("/api/admin/recommendations/", {"search": "Idea 20"})
        self.assertEqual(response.data["count"], 1)

    def test_submission_rate_is_limited(self):
        for _ in range(5):
            self.assertEqual(self.submit().status_code, 201)
        self.assertEqual(self.submit().status_code, 429)

    def test_deleted_account_keeps_suggestion_readable(self):
        user = get_user_model().objects.create_user(username="departed")
        FeatureRecommendation.objects.create(user=user, title="Keep idea", description="Still useful")
        user.delete()
        self.client.force_authenticate(self.staff)
        response = self.client.get("/api/admin/recommendations/")
        self.assertIsNone(response.data["results"][0]["username"])
