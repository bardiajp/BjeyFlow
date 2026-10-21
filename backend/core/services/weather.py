import asyncio
import json
import logging
import math
from datetime import datetime, time
from ipaddress import ip_address
from urllib.request import urlopen
from zoneinfo import ZoneInfo

import aiohttp
import python_weather
from asgiref.sync import async_to_sync
from django.conf import settings
from django.core.cache import cache
from django.utils.crypto import salted_hmac

logger = logging.getLogger(__name__)


def condition_for_code(code):
    if code in {134, 137, 140, 200, 230, 386, 389, 392, 395}:
        return "storm"
    if code in {179, 227, 323, 326, 329, 332, 335, 338, 368, 371}:
        return "snow"
    if code in {182, 317, 320, 350, 362, 365, 374, 377}:
        return "sleet"
    if code in {185, 263, 266, 281, 284}:
        return "drizzle"
    if code in {176, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359}:
        return "rain"
    if code in {125, 128, 143, 146, 149, 152, 155, 158, 161, 248, 260}:
        return "fog"
    if code == 131:
        return "wind"
    if code in {119, 122}:
        return "cloudy"
    if code == 116:
        return "partly_cloudy"
    if code == 113:
        return "clear"
    return "unknown"


def _cache_key(prefix, value):
    # Do not store raw visitor IPs in cache keys.
    digest = salted_hmac("weather", value).hexdigest()
    return f"weather:{prefix}:{digest}"


def locate_ip(ip):
    """Resolve a public IP to coordinates and an IANA timezone via ipwho.is."""
    if not ip or not ip_address(ip).is_global:
        return None
    key = _cache_key("location", ip)
    cached = cache.get(key)
    if cached is not None:
        return cached or None
    try:
        # The host is fixed and the path contains only a validated IP, not user URLs.
        with urlopen(f"https://ipwho.is/{ip}", timeout=2) as response:
            data = json.loads(response.read(65536))
        if not isinstance(data, dict) or data.get("success") is not True:
            raise ValueError("IP location unavailable")
        zone = ZoneInfo(data["timezone"]["id"])
        latitude, longitude = float(data["latitude"]), float(data["longitude"])
        if not (
            math.isfinite(latitude)
            and math.isfinite(longitude)
            and -90 <= latitude <= 90
            and -180 <= longitude <= 180
        ):
            raise ValueError("Invalid coordinates")
        location = {
            "coordinates": f"{latitude},{longitude}",
            "timezone": zone.key,
            "name": ", ".join(filter(None, [data.get("city"), data.get("country")]))[
                :200
            ],
        }
        cache.set(key, location, 86400)
        return location
    except (OSError, ValueError, KeyError, TypeError) as exc:
        logger.warning("IP geolocation unavailable (%s)", type(exc).__name__)
        cache.set(key, {}, 300)
        return None


async def _fetch_forecast(coordinates):
    # Supply our own session: bounded timeout and normal TLS certificate verification.
    async with asyncio.timeout(settings.WEATHER_REQUEST_TIMEOUT):
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=settings.WEATHER_REQUEST_TIMEOUT)
        ) as session:
            async with python_weather.Client(
                unit=python_weather.METRIC, session=session, max_retries=0
            ) as client:
                forecast = await client.get(coordinates)
                return {
                    "condition": condition_for_code(forecast.kind.value),
                    "description": forecast.description,
                    "temperature_c": forecast.temperature,
                    "days": [
                        {
                            "date": day.date.isoformat(),
                            "sunrise": day.sunrise.isoformat() if day.sunrise else None,
                            "sunset": day.sunset.isoformat() if day.sunset else None,
                            "sunlight": day.sunlight,
                        }
                        for day in forecast.daily_forecasts
                    ],
                }


def is_daytime(now, days):
    day = next((day for day in days if day["date"] == now.date().isoformat()), None)
    if day:
        if day["sunrise"] and day["sunset"]:
            return (
                time.fromisoformat(day["sunrise"])
                <= now.time()
                < time.fromisoformat(day["sunset"])
            )
        if day["sunlight"] == 0:
            return False
        if day["sunlight"] >= 24:
            return True
    return 6 <= now.hour < 18


def get_weather(ip):
    location = locate_ip(ip)
    result = {
        "available": False,
        "condition": "unknown",
        "description": "Weather unavailable",
        "temperature_c": None,
        "timezone": location["timezone"] if location else None,
        "location": location["name"] if location else None,
        "is_day": None,
    }
    if location is None:
        return result
    now = datetime.now(ZoneInfo(location["timezone"]))
    result["is_day"] = is_daytime(now, [])
    key = _cache_key("forecast", location["coordinates"])
    forecast = cache.get(key)
    if forecast is None:
        try:
            forecast = async_to_sync(_fetch_forecast)(location["coordinates"])
            cache.set(key, forecast, settings.WEATHER_CACHE_SECONDS)
        except (
            aiohttp.ClientError,
            OSError,
            ValueError,
            KeyError,
            TypeError,
            python_weather.Error,
        ) as exc:
            logger.warning("Weather forecast unavailable (%s)", type(exc).__name__)
            cache.set(key, {}, 60)
            return result
    if forecast:
        result.update(
            available=True,
            condition=forecast["condition"],
            description=forecast["description"],
            temperature_c=forecast["temperature_c"],
            is_day=is_daytime(now, forecast["days"]),
        )
    return result
