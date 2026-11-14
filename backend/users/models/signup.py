import uuid

from django.db import models


class SignupChallenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)
    password_hash = models.CharField(max_length=128)
    code_hash = models.CharField(max_length=128)
    profile = models.JSONField(default=dict)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField()
