import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_signup"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="avatar",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="user",
            name="preferences",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name="AccountSession",
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
                ("token_id", models.CharField(max_length=255, unique=True)),
                ("user_agent", models.CharField(blank=True, max_length=512)),
                ("ip_address", models.GenericIPAddressField(null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_seen", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("revoked_at", models.DateTimeField(null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="account_sessions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-last_seen"],
            },
        ),
    ]
