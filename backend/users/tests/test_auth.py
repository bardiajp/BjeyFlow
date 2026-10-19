import pytest
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_database_and_cookie_authentication(django_user_model, settings):
    user = django_user_model.objects.create_user(
        username="developer", password="test-password-only"
    )
    client = APIClient()

    response = client.post(
        reverse("login"),
        {"username": user.username, "password": "test-password-only"},
        format="json",
    )
    assert response.status_code == 200
    assert response.cookies[settings.JWT_COOKIE_NAME]["httponly"]
    assert client.get(reverse("me")).json()["user"]["id"] == str(user.pk)
    assert client.post(reverse("logout")).status_code == 200
    assert client.get(reverse("me")).status_code == 401


@pytest.mark.django_db
def test_superuser_can_be_created_by_username(django_user_model):
    user = django_user_model.objects.create_superuser(
        username="admin", password="test-password-only", display_name="Developer"
    )
    assert user.is_staff
    assert user.is_superuser
    assert user.check_password("test-password-only")


@pytest.mark.django_db
@pytest.mark.parametrize("remember", [True, False])
def test_remember_me_controls_cookie_persistence(django_user_model, settings, remember):
    django_user_model.objects.create_user("developer", "test-password-only")
    response = APIClient().post(
        reverse("login"),
        {
            "username": "developer",
            "password": "test-password-only",
            "remember_me": remember,
        },
        format="json",
    )
    assert response.status_code == 200
    cookie = response.cookies[settings.JWT_COOKIE_NAME]
    assert cookie["httponly"]
    assert cookie["samesite"] == "Lax"
    if remember:
        assert cookie["max-age"] == settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS
        assert cookie["expires"]
    else:
        assert cookie["max-age"] == ""
        assert cookie["expires"] == ""


@pytest.mark.django_db
def test_invalid_credentials_do_not_issue_cookie(django_user_model, settings):
    django_user_model.objects.create_user("developer", "test-password-only")
    response = APIClient().post(
        reverse("login"),
        {
            "username": "developer",
            "password": "wrong-password",
        },
        format="json",
    )
    assert response.status_code == 401
    assert settings.JWT_COOKIE_NAME not in response.cookies
