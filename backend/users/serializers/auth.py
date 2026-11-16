from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import User
from datetime import timedelta


class LoginSerializer(TokenObtainPairSerializer):
    default_error_messages = {"no_active_account": _("Wrong username or password")}
    remember_me = serializers.BooleanField(default=True, write_only=True)

    def validate(self, attrs):
        self.remember_me = attrs.pop("remember_me", True)
        return super().validate(attrs)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        if not self.context["user"].check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["user"])
        return value


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        validate_password(value, self.context["user"])
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)
    username_change_available_at = serializers.SerializerMethodField()

    def get_username_change_available_at(self, user):
        if user.username_changed_at:
            return user.username_changed_at + timedelta(days=7)
        return None

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "username_change_available_at",
            "display_name",
            "first_name",
            "last_name",
            "email",
            "flow_name",
            "focus_style",
            "north_star",
            "avatar",
            "preferences",
            "role",
        )


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(
        min_length=3, max_length=150, validators=[UnicodeUsernameValidator()]
    )
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(
        write_only=True, min_length=8, max_length=128, trim_whitespace=False
    )
    flow_name = serializers.CharField(max_length=60, allow_blank=True, default="")
    focus_style = serializers.ChoiceField(
        choices=("morning_tide", "night_current", "steady_tide"), default="steady_tide"
    )
    north_star = serializers.CharField(max_length=200, allow_blank=True, default="")
    workspace_name = serializers.CharField(max_length=150, default="My first ripple")

    def validate_username(self, value):
        value = User.normalize_username(value)
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account already uses this email. Please sign in."
            )
        return value

    def validate(self, attrs):
        validate_password(
            attrs["password"],
            User(
                username=attrs["username"],
                email=attrs["email"],
                first_name=attrs["first_name"],
                last_name=attrs["last_name"],
            ),
        )
        return attrs


class SignupVerifySerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    code = serializers.RegexField(r"^[0-9]{6}$", trim_whitespace=True)


class SignupResendSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
