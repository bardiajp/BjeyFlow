import json
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from zoneinfo import ZoneInfo

import python_weather
from asgiref.sync import async_to_sync
from django.core.cache import cache
from django.test import RequestFactory, SimpleTestCase, override_settings

from core.services.weather import (
    _fetch_forecast,
    condition_for_code,
    get_weather,
    is_daytime,
    locate_ip,
)
from core.utils import get_ip


class ClientIPTests(SimpleTestCase):
    def request(self, peer, forwarded=None):
        headers = {"REMOTE_ADDR": peer}
        if forwarded is not None:
            headers["HTTP_X_FORWARDED_FOR"] = forwarded
        return RequestFactory().get("/", **headers)

    @override_settings(WEATHER_TRUSTED_PROXIES=[])
    def test_untrusted_forwarded_header_is_ignored(self):
        self.assertEqual(get_ip(self.request("8.8.8.8", "1.1.1.1")), "8.8.8.8")

    @override_settings(WEATHER_TRUSTED_PROXIES=["10.0.0.0/8"])
    def test_walks_only_trusted_hops_from_right(self):
        request = self.request("10.0.0.2", "9.9.9.9, 1.1.1.1, 10.0.0.1")
        self.assertEqual(get_ip(request), "1.1.1.1")

    @override_settings(WEATHER_TRUSTED_PROXIES=["10.0.0.0/8"])
    def test_malformed_forwarding_uses_peer(self):
        self.assertEqual(get_ip(self.request("10.0.0.2", "bad, 1.1.1.1")), "10.0.0.2")

    def test_invalid_peer_is_not_used(self):
        self.assertIsNone(get_ip(self.request("invalid", "8.8.8.8")))

    def test_ipv6_is_supported(self):
        self.assertEqual(
            get_ip(self.request("2606:4700:4700::1111")), "2606:4700:4700::1111"
        )

    def test_ipv4_mapped_ipv6_is_normalized(self):
        self.assertEqual(get_ip(self.request("::ffff:8.8.8.8")), "8.8.8.8")


class WeatherTests(SimpleTestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        self.location = {
            "coordinates": "35.7,51.4",
            "timezone": "Asia/Tehran",
            "name": "Tehran, Iran",
        }
        self.day = {
            "date": "2026-10-21",
            "sunrise": "06:15:00",
            "sunset": "17:30:00",
            "sunlight": 11.25,
        }
        self.forecast = {
            "condition": "rain",
            "description": "Light rain",
            "temperature_c": 12,
            "days": [self.day],
        }

    def test_all_python_weather_kinds_have_a_mapping(self):
        for kind in python_weather.Kind:
            with self.subTest(kind=kind):
                self.assertNotEqual(condition_for_code(kind.value), "unknown")
        self.assertEqual(condition_for_code(9999), "unknown")

    def test_weather_categories(self):
        for code, expected in {
            113: "clear",
            116: "partly_cloudy",
            119: "cloudy",
            122: "cloudy",
            296: "rain",
            266: "drizzle",
            338: "snow",
            350: "sleet",
            248: "fog",
            131: "wind",
            389: "storm",
            134: "storm",
        }.items():
            with self.subTest(code=code):
                self.assertEqual(condition_for_code(code), expected)

    @patch("core.services.weather.urlopen")
    def test_private_and_local_ips_never_leave_server(self, fetch):
        for ip in (None, "127.0.0.1", "192.168.1.1", "10.0.0.1", "::1", "169.254.1.1"):
            self.assertFalse(get_weather(ip)["available"])
        fetch.assert_not_called()

    @patch("core.services.weather.urlopen")
    def test_geolocation_parses_and_caches_timezone_and_coordinates(self, fetch):
        fetch.return_value.__enter__.return_value.read.return_value = json.dumps(
            {
                "success": True,
                "latitude": 35.7,
                "longitude": 51.4,
                "timezone": {"id": "Asia/Tehran"},
                "city": "Tehran",
                "country": "Iran",
            }
        ).encode()
        self.assertEqual(locate_ip("8.8.8.8"), self.location)
        self.assertEqual(locate_ip("8.8.8.8"), self.location)
        fetch.assert_called_once_with("https://ipwho.is/8.8.8.8", timeout=2)

    @patch("core.services.weather.urlopen", side_effect=TimeoutError)
    def test_geolocation_outage_is_cached_and_nonfatal(self, fetch):
        self.assertFalse(get_weather("8.8.8.8")["available"])
        self.assertFalse(get_weather("8.8.8.8")["available"])
        fetch.assert_called_once()

    @patch("core.services.weather.urlopen")
    def test_invalid_geolocation_data_is_nonfatal(self, fetch):
        for payload in (
            [],
            {"success": False},
            {"success": True, "timezone": {"id": "Not/AZone"}},
            {
                "success": True,
                "timezone": {"id": "UTC"},
                "latitude": 999,
                "longitude": 0,
            },
        ):
            cache.clear()
            fetch.return_value.__enter__.return_value.read.return_value = json.dumps(
                payload
            ).encode()
            self.assertIsNone(locate_ip("8.8.8.8"))

    def test_sunrise_and_sunset_boundaries(self):
        for hour, minute, expected in (
            (6, 14, False),
            (6, 15, True),
            (17, 29, True),
            (17, 30, False),
        ):
            now = datetime(2026, 10, 21, hour, minute, tzinfo=ZoneInfo("Asia/Tehran"))
            self.assertEqual(is_daytime(now, [self.day]), expected)

    def test_polar_day_and_night(self):
        now = datetime(2026, 10, 21, 12)
        day = {**self.day, "sunrise": None, "sunset": None, "sunlight": 0}
        self.assertFalse(is_daytime(now, [day]))
        self.assertTrue(is_daytime(now, [{**day, "sunlight": 24}]))

    @patch("core.services.weather.datetime")
    @patch("core.services.weather._fetch_forecast", new_callable=AsyncMock)
    @patch("core.services.weather.locate_ip")
    def test_forecast_cached_but_day_night_recomputed(self, locate, fetch, clock):
        locate.return_value = self.location
        fetch.return_value = self.forecast
        clock.now.side_effect = [
            datetime(2026, 10, 21, 12, tzinfo=ZoneInfo("Asia/Tehran")),
            datetime(2026, 10, 21, 23, tzinfo=ZoneInfo("Asia/Tehran")),
        ]
        day = get_weather("8.8.8.8")
        night = get_weather("8.8.8.8")
        self.assertTrue(day["is_day"])
        self.assertFalse(night["is_day"])
        self.assertEqual(night["condition"], "rain")
        self.assertEqual(day["timezone"], "Asia/Tehran")
        self.assertNotIn("ip", day)
        self.assertNotIn("coordinates", day)
        fetch.assert_awaited_once_with("35.7,51.4")
        clock.now.assert_called_with(ZoneInfo("Asia/Tehran"))

    @patch("core.services.weather._fetch_forecast", new_callable=AsyncMock)
    @patch("core.services.weather.locate_ip")
    def test_forecast_timeout_preserves_location_and_is_cached(self, locate, fetch):
        locate.return_value = self.location
        fetch.side_effect = TimeoutError
        result = get_weather("8.8.8.8")
        self.assertFalse(result["available"])
        self.assertEqual(result["timezone"], "Asia/Tehran")
        get_weather("8.8.8.8")
        fetch.assert_awaited_once()

    @patch("core.services.weather.python_weather.Client")
    def test_python_weather_uses_coordinates_and_metric_units(self, client):
        provider = client.return_value.__aenter__.return_value
        provider.get = AsyncMock(
            return_value=SimpleNamespace(
                kind=python_weather.Kind.LIGHT_RAIN,
                description="Light rain",
                temperature=12,
                daily_forecasts=[],
            )
        )
        result = async_to_sync(_fetch_forecast)("35.7,51.4")
        provider.get.assert_awaited_once_with("35.7,51.4")
        self.assertEqual(client.call_args.kwargs["unit"], python_weather.METRIC)
        self.assertEqual(client.call_args.kwargs["max_retries"], 0)
        self.assertEqual(result["condition"], "rain")

    @patch("core.views.weather.get_weather")
    def test_weather_endpoint_works_without_login(self, weather):
        weather.return_value = {"available": False, "condition": "unknown"}
        response = self.client.get("/api/weather/", REMOTE_ADDR="127.0.0.1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "private, no-store")
        weather.assert_called_once_with("127.0.0.1")

    @patch("core.views.weather.get_weather", return_value={"available": False})
    @override_settings(DEBUG=True, WEATHER_DEV_IP="1.1.1.1")
    def test_development_ip_overrides_private_peer(self, weather):
        response = self.client.get("/api/weather/", REMOTE_ADDR="172.18.0.1")
        self.assertEqual(response.status_code, 200)
        weather.assert_called_once_with("1.1.1.1")

    @patch("core.views.weather.get_weather", return_value={"available": False})
    @override_settings(DEBUG=True, WEATHER_DEV_IP="1.1.1.1")
    def test_development_ip_overrides_missing_peer(self, weather):
        response = self.client.get("/api/weather/", REMOTE_ADDR="")
        self.assertEqual(response.status_code, 200)
        weather.assert_called_once_with("1.1.1.1")

    @patch("core.views.weather.get_weather", return_value={"available": False})
    @override_settings(DEBUG=True, WEATHER_DEV_IP="1.1.1.1")
    def test_development_ip_does_not_replace_public_visitor(self, weather):
        self.client.get("/api/weather/", REMOTE_ADDR="8.8.8.8")
        weather.assert_called_once_with("8.8.8.8")

    @patch("core.views.weather.get_weather", return_value={"available": False})
    @override_settings(DEBUG=False, WEATHER_DEV_IP="1.1.1.1")
    def test_development_ip_is_ignored_in_production(self, weather):
        self.client.get("/api/weather/", REMOTE_ADDR="172.18.0.1")
        weather.assert_called_once_with("172.18.0.1")

    @patch("core.views.weather.get_weather", return_value={"available": False})
    def test_public_endpoint_is_throttled(self, weather):
        for _ in range(30):
            self.assertEqual(self.client.get("/api/weather/").status_code, 200)
        self.assertEqual(
            self.client.get(
                "/api/weather/", HTTP_X_FORWARDED_FOR="8.8.8.8"
            ).status_code,
            429,
        )
        self.assertEqual(weather.call_count, 30)
