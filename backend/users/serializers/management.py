from django.contrib.auth import get_user_model
from rest_framework import serializers

from users.services.management import user_management_service
from core.services.xp import level_progress
from django.db.models import Sum

User = get_user_model()

ROLE_CHOICES = ("superuser", "staff", "user")


class ManagedUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=ROLE_CHOICES)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "display_name",
            "first_name",
            "last_name",
            "mobile",
            "email",
            "is_active",
            "role",
            "password",
            "date_joined",
            "last_login",
            "level",
        )
        read_only_fields = ("id", "date_joined", "last_login", "level")

    def get_level(self, user):
        if hasattr(user, "active_xp"):
            total = user.active_xp or 0
        else:
            total = user.task_xp.filter(active=True).aggregate(total=Sum("amount"))["total"] or 0
        return level_progress(total)["level"]

    def validate_email(self, value):
        value = value.lower()
        queryset = User.objects.filter(email__iexact=value).exclude(email="")
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "This field is required."})
        return attrs

    def create(self, validated_data):
        return user_management_service.create_user(
            self.context["request"].user, validated_data
        )

    def update(self, instance, validated_data):
        return user_management_service.update_user(
            self.context["request"].user, instance, validated_data
        )
