from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0002_project_icon")]

    operations = [
        migrations.AddField(
            model_name="task",
            name="deleted_at",
            field=models.DateTimeField(
                blank=True, db_index=True, editable=False, null=True
            ),
        ),
    ]
