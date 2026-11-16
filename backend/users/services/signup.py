from core.models import Project
from users.models import User


def create_signup_user(challenge):
    profile = challenge.profile.copy()
    workspace_name = profile.pop("workspace_name")
    user = User.objects.create(
        username=challenge.username,
        email=challenge.email,
        password=challenge.password_hash,
        display_name=f"{profile['first_name']} {profile['last_name']}"[:150],
        is_staff=False,
        is_superuser=False,
        **profile,
    )
    Project.objects.create(owner=user, name=workspace_name, icon="folder")
    challenge.delete()
    return user
