import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("kind", models.CharField(max_length=40)),
                ("recipient", models.EmailField(max_length=254)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("accepted", "Accepted by backend"),
                            ("failed", "Failed"),
                        ],
                        max_length=20,
                    ),
                ),
                ("backend", models.CharField(max_length=150)),
                ("error_type", models.CharField(blank=True, max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "ordering": ["-created_at", "-id"],
            },
        ),
        migrations.CreateModel(
            name="SiteSettings",
            fields=[
                (
                    "id",
                    models.PositiveSmallIntegerField(
                        default=1, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("app_name", models.CharField(default="BjeyFlow", max_length=60)),
                ("support_email", models.EmailField(blank=True, max_length=254)),
                ("signup_enabled", models.BooleanField(default=True)),
                ("announcement", models.CharField(blank=True, max_length=500)),
                ("maintenance_notice", models.CharField(blank=True, max_length=500)),
                (
                    "trash_retention_days",
                    models.PositiveSmallIntegerField(
                        default=0,
                        validators=[django.core.validators.MaxValueValidator(365)],
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="SystemEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("source", models.CharField(max_length=150)),
                ("error_type", models.CharField(blank=True, max_length=150)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "ordering": ["-created_at", "-id"],
            },
        ),
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("actor_name", models.CharField(blank=True, max_length=150)),
                ("action", models.CharField(db_index=True, max_length=80)),
                ("target", models.CharField(blank=True, max_length=150)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("metadata", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at", "-id"],
            },
        ),
    ]
