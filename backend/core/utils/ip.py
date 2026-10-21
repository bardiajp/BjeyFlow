from ipaddress import ip_address, ip_network

from django.conf import settings


def _parse_ip(value):
    try:
        address = ip_address(value.strip())
        return getattr(address, "ipv4_mapped", None) or address
    except (ValueError, AttributeError):
        return None


def get_ip(request):
    """Return a validated client IP; only honor XFF from explicitly trusted proxies.

    Configure WEATHER_TRUSTED_PROXIES with the IPs/CIDRs of your reverse proxies.
    Walk X-Forwarded-For right-to-left, discarding only known proxy hops.
    """
    peer = _parse_ip(request.META.get("REMOTE_ADDR", ""))
    if peer is None:
        return None
    proxies = [ip_network(value) for value in settings.WEATHER_TRUSTED_PROXIES]

    def trusted(address):
        return any(address in network for network in proxies)

    if not trusted(peer):
        return str(peer)
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if not forwarded or len(forwarded) > 2048:
        return str(peer)
    chain = [_parse_ip(value) for value in forwarded.split(",")]
    if any(address is None for address in chain):
        return str(peer)
    client = peer
    for address in reversed(chain):
        if not trusted(client):
            break
        client = address
    return str(client)
