from django.contrib.auth import get_user_model
from rest_framework import serializers

from users.services.management import user_management_service

User = get_user_model()

ROLE_CHOICES = ("superuser", "staff", "user")


class ManagedUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=ROLE_CHOICES)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "display_name",
            "first_name",
            "last_name",
            "mobile",
            "is_active",
            "role",
            "password",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined")

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "This field is required."})
        return attrs

    def create(self, validated_data):
        return user_management_service.create_user(validated_data)

    def update(self, instance, validated_data):
        return user_management_service.update_user(instance, validated_data)
