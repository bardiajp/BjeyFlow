from rest_framework import serializers


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.UUIDField()
    token = serializers.CharField(max_length=128)
    new_password = serializers.CharField(max_length=128, trim_whitespace=False)
