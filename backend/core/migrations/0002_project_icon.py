from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="project",
            name="icon",
            field=models.CharField(
                choices=[
                    ("hash", "Hash"),
                    ("folder", "Folder"),
                    ("briefcase", "Briefcase"),
                    ("code", "Code"),
                    ("book", "Book"),
                    ("heart", "Heart"),
                    ("star", "Star"),
                    ("target", "Target"),
                    ("palette", "Palette"),
                    ("coffee", "Coffee"),
                    ("music", "Music"),
                    ("rocket", "Rocket"),
                ],
                default="hash",
                max_length=20,
            ),
        ),
    ]
