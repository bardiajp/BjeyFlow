import uuid

from django.db import migrations, models
from django.db.models.functions import Lower


class Migration(migrations.Migration):
    dependencies = [("users", "0002_user_profile_fields")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
        migrations.AddField(
            model_name="user",
            name="flow_name",
            field=models.CharField(blank=True, max_length=60),
        ),
        migrations.AddField(
            model_name="user",
            name="focus_style",
            field=models.CharField(
                choices=[
                    ("morning_tide", "Morning tide"),
                    ("night_current", "Night current"),
                    ("steady_tide", "Steady tide"),
                ],
                default="steady_tide",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="north_star",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.UniqueConstraint(
                Lower("email"),
                condition=~models.Q(email=""),
                name="users_email_lower_unique",
            ),
        ),
        migrations.CreateModel(
            name="SignupChallenge",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("username", models.CharField(max_length=150)),
                ("password_hash", models.CharField(max_length=128)),
                ("code_hash", models.CharField(max_length=128)),
                ("profile", models.JSONField(default=dict)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("expires_at", models.DateTimeField()),
                ("last_sent_at", models.DateTimeField()),
            ],
        ),
    ]
