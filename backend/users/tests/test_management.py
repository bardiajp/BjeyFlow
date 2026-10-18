import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from users.models import User
from users.views.management import UserManagementViewSet

pytestmark = pytest.mark.django_db


@pytest.fixture
def admin():
    return User.objects.create_superuser("admin", "initial-password")


@pytest.fixture
def client(admin):
    api = APIClient()
    api.force_authenticate(admin)
    return api


@pytest.mark.parametrize(
    "role,expected", [(None, 401), ("user", 403), ("staff", 403), ("superuser", 200)]
)
def test_only_system_administrators_can_manage_users(role, expected):
    api = APIClient()
    if role:
        user = User(username="reader")
        user.set_role(role)
        user.save()
        api.force_authenticate(user)
    assert api.get(reverse("users-list")).status_code == expected


def test_create_retrieve_update_and_delete_user(client):
    response = client.post(
        reverse("users-list"),
        {
            "username": "new-user",
            "display_name": "New User",
            "password": "secure-password",
            "role": "staff",
        },
        format="json",
    )
    assert response.status_code == 201
    assert "password" not in response.data
    user = User.objects.get(pk=response.data["id"])
    assert user.check_password("secure-password")
    assert user.role == "staff"
    detail = reverse("users-detail", args=[user.pk])
    assert client.get(detail).data["username"] == "new-user"
    response = client.patch(
        detail,
        {
            "username": "renamed",
            "first_name": "Ada",
            "last_name": "Lovelace",
            "mobile": "+123456789",
            "role": "superuser",
            "password": "updated-password",
        },
        format="json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.username == "renamed"
    assert user.first_name == "Ada"
    assert user.last_name == "Lovelace"
    assert user.mobile == "+123456789"
    assert user.is_staff and user.is_superuser
    assert user.check_password("updated-password")
    assert client.delete(detail).status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()


@pytest.mark.parametrize("role,expected", [(None, 401), ("user", 403), ("staff", 403)])
def test_create_user_is_not_public_and_cannot_be_used_to_escalate_role(role, expected):
    api = APIClient()
    if role:
        actor = User.objects.create_user("actor", "initial-password")
        actor.set_role(role)
        actor.save()
        api.force_authenticate(actor)
    response = api.post(
        reverse("users-list"),
        {
            "username": "unauthorized-admin",
            "password": "secure-password",
            "role": "superuser",
        },
        format="json",
    )
    assert response.status_code == expected
    assert not User.objects.filter(username="unauthorized-admin").exists()


def test_create_user_rejects_duplicate_username(client):
    body = {"username": "same-name", "password": "secure-password", "role": "user"}
    assert client.post(reverse("users-list"), body, format="json").status_code == 201
    response = client.post(reverse("users-list"), body, format="json")
    assert response.status_code == 400
    assert "username" in response.data
    assert User.objects.filter(username="same-name").count() == 1


@pytest.mark.parametrize(
    "body",
    [
        {"username": "new", "role": "user"},
        {"username": "new", "role": "invalid", "password": "secure-password"},
        {"username": "new", "role": "user", "password": "short"},
    ],
)
def test_create_rejects_invalid_data(client, body):
    assert client.post(reverse("users-list"), body, format="json").status_code == 400


def test_activation_and_disabled_user_login(client):
    user = User.objects.create_user("managed", "initial-password")
    disable = reverse("users-disable", args=[user.pk])
    activate = reverse("users-activate", args=[user.pk])
    assert client.post(disable).status_code == 200
    assert client.post(disable).status_code == 400
    anon = APIClient()
    assert (
        anon.post(
            reverse("login"),
            {
                "username": user.username,
                "password": "initial-password",
            },
        ).status_code
        == 401
    )
    assert client.post(activate).status_code == 200
    assert client.post(activate).status_code == 400
    assert (
        anon.post(
            reverse("login"),
            {
                "username": user.username,
                "password": "initial-password",
            },
        ).status_code
        == 200
    )


def test_cannot_delete_disable_or_reset_own_account(client, admin):
    assert client.delete(reverse("users-detail", args=[admin.pk])).status_code == 400
    assert client.post(reverse("users-disable", args=[admin.pk])).status_code == 400
    assert (
        client.post(
            reverse("users-reset-password", args=[admin.pk]),
            {
                "new_password": "updated-password",
            },
        ).status_code
        == 400
    )


def test_last_active_administrator_is_protected(admin):
    from rest_framework.exceptions import ValidationError

    with pytest.raises(ValidationError, match="administrator"):
        UserManagementViewSet().perform_destroy(admin)
    inactive = User.objects.create_superuser(
        "inactive", "initial-password", is_active=False
    )
    api = APIClient()
    api.force_authenticate(inactive)
    assert api.post(reverse("users-disable", args=[admin.pk])).status_code == 400


def test_password_change_and_reset(client, admin):
    url = reverse("change-password")
    assert (
        client.post(
            url, {"current_password": "incorrect", "new_password": "updated-password"}
        ).status_code
        == 400
    )
    assert (
        client.post(
            url, {"current_password": "initial-password", "new_password": "short"}
        ).status_code
        == 400
    )
    assert (
        client.post(
            url,
            {
                "current_password": "initial-password",
                "new_password": "updated-password",
            },
        ).status_code
        == 200
    )
    admin.refresh_from_db()
    assert admin.check_password("updated-password")
    user = User.objects.create_user("managed", "initial-password")
    reset = reverse("users-reset-password", args=[user.pk])
    assert client.post(reset, {"new_password": "short"}).status_code == 400
    assert client.post(reset, {"new_password": "reset-password"}).status_code == 200
    user.refresh_from_db()
    assert user.check_password("reset-password")


def test_model_normalizes_username_and_roles():
    user = User.objects.create_user("ℌello", "initial-password")
    assert user.username == "Hello"
    for role in ("user", "staff", "superuser"):
        user.set_role(role)
        user.save()
        user.refresh_from_db()
        assert user.role == role
    with pytest.raises(ValueError):
        user.set_role("invalid")
