import base64
import binascii
import io
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from PIL import Image, UnidentifiedImageError
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers

from core.models import Project
from users.models import User


class UsernameUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150, validators=[UnicodeUsernameValidator()])

    def validate_username(self, value):
        return User.normalize_username(value)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("display_name", "avatar", "flow_name", "north_star")

    def validate_avatar(self, value):
        if not value:
            return value
        if len(value) > 180_000 or not value.startswith("data:image/webp;base64,"):
            raise serializers.ValidationError(
                "Choose a WebP avatar smaller than 128 KB."
            )
        try:
            raw = base64.b64decode(value.split(",", 1)[1], validate=True)
            with Image.open(io.BytesIO(raw)) as image:
                if image.format != "WEBP" or image.width > 512 or image.height > 512:
                    raise serializers.ValidationError(
                        "Avatar must be a WebP image up to 512 × 512 pixels."
                    )
                image.verify()
        except (
            ValueError,
            binascii.Error,
            UnidentifiedImageError,
            OSError,
            Image.DecompressionBombError,
        ) as error:
            raise serializers.ValidationError("Invalid avatar image.") from error
        return value


class PreferencesSerializer(serializers.Serializer):
    theme = serializers.ChoiceField(choices=("system", "light", "dark"))
    waterEffects = serializers.BooleanField()
    clickSplash = serializers.BooleanField()
    focusMinutes = serializers.ChoiceField(choices=(15, 25, 50, 90))
    toastDuration = serializers.ChoiceField(choices=(3000, 5000, 8000))
    defaultView = serializers.ChoiceField(choices=("list", "board", "calendar"))
    defaultProject = serializers.UUIDField(allow_null=True)
    defaultPriority = serializers.ChoiceField(
        choices=("low", "normal", "high", "urgent")
    )
    taskOrdering = serializers.ChoiceField(
        choices=(
            "position,created_at",
            "due_date,due_time",
            "-created_at",
            "created_at",
            "title",
            "-title",
        )
    )
    hideCompleted = serializers.BooleanField()
    calendar = serializers.ChoiceField(choices=("gregory", "persian"))
    weekStart = serializers.ChoiceField(choices=(0, 1, 6))
    hourCycle = serializers.ChoiceField(choices=("h12", "h23"))
    timeZone = serializers.CharField(max_length=100)
    browserNotifications = serializers.BooleanField()
    returnNotifications = serializers.BooleanField()
    goalNotifications = serializers.BooleanField()
    leagueRankNotifications = serializers.BooleanField()
    weeklyReviewNotifications = serializers.BooleanField()
    dailyPlanNotifications = serializers.BooleanField()
    dailyPlanTime = serializers.RegexField(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    reminderMinutes = serializers.ChoiceField(choices=(0, 5, 15, 30, 60, 1440))
    quietHours = serializers.BooleanField()
    quietStart = serializers.RegexField(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    quietEnd = serializers.RegexField(r"^(?:[01]\d|2[0-3]):[0-5]\d$")

    def to_internal_value(self, data):
        values = super().to_internal_value(data)
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError(
                {key: "Unknown preference." for key in unknown}
            )
        return values

    def validate_timeZone(self, value):
        if value != "system":
            try:
                ZoneInfo(value)
            except ZoneInfoNotFoundError as error:
                raise serializers.ValidationError(
                    "Choose a valid IANA time zone."
                ) from error
        return value

    def validate_defaultProject(self, value):
        if (
            value is not None
            and not Project.objects.filter(
                pk=value, owner=self.context["request"].user, is_archived=False
            ).exists()
        ):
            raise serializers.ValidationError("Choose one of your active projects.")
        return str(value) if value is not None else None
