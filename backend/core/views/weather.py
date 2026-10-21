from ipaddress import ip_address

from django.conf import settings
from django.utils.crypto import salted_hmac
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from core.services.weather import get_weather
from core.utils.ip import get_ip


class WeatherThrottle(ScopedRateThrottle):
    def get_ident(self, request):
        # Use the same trusted-proxy policy for rate limiting, not arbitrary XFF.
        return salted_hmac("weather-throttle", get_ip(request) or "unknown").hexdigest()


class WeatherView(APIView):
    # Also used on the login page; never authenticate/clear an expired login cookie.
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [WeatherThrottle]
    throttle_scope = "weather"

    def get(self, request):
        ip = get_ip(request)
        if (
            settings.DEBUG
            and settings.WEATHER_DEV_IP
            and (ip is None or not ip_address(ip).is_global)
        ):
            ip = settings.WEATHER_DEV_IP
        response = Response(get_weather(ip))
        response["Cache-Control"] = "private, no-store"
        return response
