import requests
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

ASSETS = {
    "linux_appimage": "BjeyFlow-linux-x64.AppImage",
    "linux_deb": "BjeyFlow-linux-x64.deb",
    "windows_installer": "BjeyFlow-Windows-x64-Setup.exe",
    "windows_portable": "BjeyFlow-Windows-x64-Portable.exe",
    "appimage_icon": "BjeyFlow-icon.png",
    "appimage_guide": "BjeyFlow-AppImage-README.txt",
}


class DesktopReleaseView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        result = cache.get("desktop-release-assets")
        if result is None:
            try:
                response = requests.get(
                    "https://api.github.com/repos/bardiajp/BjeyFlow/releases",
                    params={"per_page": 30},
                    headers={"Accept": "application/vnd.github+json"},
                    timeout=5,
                )
                response.raise_for_status()
            except requests.RequestException:
                return Response(
                    {"detail": "Desktop releases are temporarily unavailable."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            result = {"available": False, "assets": {}}
            for release in response.json():
                if (
                    release["draft"]
                    or release["prerelease"]
                    or not release["tag_name"].startswith("desktop-v")
                ):
                    continue
                assets = {
                    key: asset["browser_download_url"]
                    for key, name in ASSETS.items()
                    for asset in release["assets"]
                    if asset["name"] == name
                    and asset["state"] == "uploaded"
                    and asset["browser_download_url"].startswith(
                        "https://github.com/bardiajp/BjeyFlow/releases/download/"
                    )
                }
                if any(key in assets for key in ("linux_appimage", "linux_deb", "windows_installer", "windows_portable")):
                    result = {"available": True, "version": release["tag_name"], "assets": assets}
                    break
            cache.set("desktop-release-assets", result, 900)
        return Response(result)
