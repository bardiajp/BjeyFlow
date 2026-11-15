from itertools import product
import re
from string import ascii_uppercase

from django.core.validators import RegexValidator
from django.db import migrations, models


def assign_identifiers(apps, schema_editor):
    Project = apps.get_model("core", "Project")
    Task = apps.get_model("core", "Task")
    used_by_owner = {}
    for project in Project.objects.order_by("owner_id", "created_at", "id").iterator():
        used = used_by_owner.setdefault(project.owner_id, set())
        letters = re.sub(r"[^A-Z]", "", project.name.upper())
        key = letters[:4] if len(letters) >= 2 else "PR"
        if key in used:
            key = next(
                (
                    "".join(parts)
                    for parts in product(ascii_uppercase, repeat=4)
                    if "".join(parts) not in used
                ),
                None,
            )
        if key is None:
            raise RuntimeError("Project key capacity exceeded for an account.")
        used.add(key)
        tasks = list(
            Task.objects.filter(project_id=project.pk).order_by("created_at", "id")
        )
        for number, task in enumerate(tasks, start=1):
            task.number = number
        Task.objects.bulk_update(tasks, ["number"], batch_size=1000)
        Project.objects.filter(pk=project.pk).update(key=key, task_sequence=len(tasks))


class Migration(migrations.Migration):
    dependencies = [("core", "0003_task_deleted_at")]
    operations = [
        migrations.AddField(
            model_name="project",
            name="key",
            field=models.CharField(max_length=4, null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="task_sequence",
            field=models.PositiveBigIntegerField(default=0, editable=False),
        ),
        migrations.AddField(
            model_name="task",
            name="number",
            field=models.PositiveBigIntegerField(null=True, editable=False),
        ),
        migrations.RunPython(assign_identifiers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="project",
            name="key",
            field=models.CharField(
                max_length=4,
                validators=[
                    RegexValidator(
                        r"^[A-Z]{2,4}$", "Use 2–4 uppercase letters, such as FLOW."
                    )
                ],
            ),
        ),
        migrations.AlterField(
            model_name="task",
            name="number",
            field=models.PositiveBigIntegerField(editable=False),
        ),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.UniqueConstraint(
                fields=["owner", "key"], name="project_owner_key_unique"
            ),
        ),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.CheckConstraint(
                condition=models.Q(key__regex=r"^[A-Z]{2,4}$"),
                name="project_key_uppercase",
            ),
        ),
        migrations.AddConstraint(
            model_name="task",
            constraint=models.UniqueConstraint(
                fields=["project", "number"], name="task_project_number_unique"
            ),
        ),
        migrations.AddConstraint(
            model_name="task",
            constraint=models.CheckConstraint(
                condition=models.Q(number__gt=0), name="task_number_positive"
            ),
        ),
    ]
