import re
import socket
import ipaddress
import urllib.parse
from typing import Optional, Tuple, List
import httpx
import idna
from backend.app.core.exceptions import SSRFBlockedException, InvalidURLException

FORBIDDEN_HOSTS = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "metadata.google.internal",
    "instance-data",
}

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),       # Shared Address Space
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / Cloud metadata (169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),     # RFC 1918 Private
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1
    ipaddress.ip_network("192.88.99.0/24"),     # 6to4 Relay Anycast
    ipaddress.ip_network("192.168.0.0/16"),     # RFC 1918 Private
    ipaddress.ip_network("198.18.0.0/15"),      # Network benchmark tests
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved / Future use
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    # IPv6
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("2001:db8::/32"),      # Documentation
    ipaddress.ip_network("fc00::/7"),           # Unique local address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-local
    ipaddress.ip_network("ff00::/8"),           # Multicast
]

NAT64_PREFIX = ipaddress.ip_network("64:ff9b::/96")
IPV4_MAPPED_PREFIX = ipaddress.ip_network("::ffff:0:0/96")

def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Checks if an IP address belongs to any private, loopback, or cloud-metadata network."""
    # Check IPv4-embedded IPv6 (NAT64 / IPv4-mapped)
    if isinstance(ip, ipaddress.IPv6Address):
        if ip in NAT64_PREFIX or ip in IPV4_MAPPED_PREFIX:
            # Extract underlying embedded IPv4 address and check it
            embedded_v4 = ipaddress.IPv4Address(ip.packed[12:16])
            return is_ip_blocked(embedded_v4)

    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
        return True
    for network in BLOCKED_IP_NETWORKS:
        if ip in network:
            return True
    return False

def validate_url_ssrf(url_str: str) -> str:
    """
    Validates that a URL does not point to internal/loopback/cloud metadata IP addresses.
    Encodes IDN domains to Punycode.
    Raises SSRFBlockedException or InvalidURLException on violations.
    """
    if not url_str or len(url_str) > 2048:
        raise InvalidURLException("URL is empty or exceeds the maximum permitted length of 2048 characters.")

    parsed = urllib.parse.urlparse(url_str)
    if parsed.scheme.lower() not in ("http", "https"):
        raise InvalidURLException(f"Scheme '{parsed.scheme}' is not allowed. Only HTTP and HTTPS are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise InvalidURLException("URL does not contain a valid hostname.")

    hostname_clean = hostname.strip().lower()
    if hostname_clean in FORBIDDEN_HOSTS or hostname_clean.endswith(".local") or hostname_clean.endswith(".internal"):
        raise SSRFBlockedException(f"Access to internal host '{hostname}' is blocked.")

    # Convert IDN hostname to Punycode
    try:
        encoded_host = idna.encode(hostname_clean).decode("ascii")
    except Exception:
        encoded_host = hostname_clean

    # Try resolving hostname directly as IP address
    try:
        ip = ipaddress.ip_address(encoded_host)
        if is_ip_blocked(ip):
            raise SSRFBlockedException(f"Access to private/internal IP address '{ip}' is blocked.")
    except ValueError:
        # Not a raw IP literal, resolve via DNS
        try:
            addr_info = socket.getaddrinfo(encoded_host, parsed.port or (443 if parsed.scheme == "https" else 80), socket.AF_UNSPEC, socket.SOCK_STREAM)
            for family, socktype, proto, canonname, sockaddr in addr_info:
                ip_str = sockaddr[0]
                resolved_ip = ipaddress.ip_address(ip_str)
                if is_ip_blocked(resolved_ip):
                    raise SSRFBlockedException(f"Destination resolves to blocked internal IP address: {resolved_ip}")
        except socket.gaierror:
            # Cannot resolve host via DNS
            pass

    return url_str

async def resolve_redirects_safely(url_str: str, max_hops: int = 5, timeout_sec: float = 5.0) -> str:
    """
    Safely resolves URL shorteners (bit.ly, t.co, etc.) up to max_hops,
    re-validating SSRF security on every redirection hop.
    """
    current_url = validate_url_ssrf(url_str)
    
    # Fast check: If it's a common shortener or unknown redirect, follow HEAD
    shorteners = {"bit.ly", "t.co", "tinyurl.com", "is.gd", "buff.ly", "ow.ly", "cutt.ly", "rb.gy", "rebrand.ly"}
    parsed = urllib.parse.urlparse(current_url)
    if parsed.hostname and (parsed.hostname.lower() in shorteners or len(parsed.path) <= 12):
        try:
            async with httpx.AsyncClient(follow_redirects=False, timeout=timeout_sec) as client:
                hops = 0
                while hops < max_hops:
                    validate_url_ssrf(current_url)
                    response = await client.head(current_url)
                    if response.is_redirect and "location" in response.headers:
                        next_url = urllib.parse.urljoin(current_url, response.headers["location"])
                        validate_url_ssrf(next_url)
                        current_url = next_url
                        hops += 1
                    else:
                        break
        except Exception:
            # Fall back to current URL if redirect resolution timed out or was blocked
            pass

    return current_url

def sanitize_format_id(format_id: str) -> str:
    """
    Sanitizes format IDs to prevent shell/command injection.
    Only allows alphanumeric, hyphens, underscores, dots, colons, brackets, comparisons, and plus/slash signs.
    """
    if not format_id:
        return ""
    if not re.match(r"^[A-Za-z0-9_.\-:+/\[\]<=,]+$", format_id):
        raise InvalidURLException("Invalid format identifier supplied.")
    return format_id

def sanitize_filename(name: str, max_length: int = 120, fallback: str = "media") -> str:
    """
    Sanitizes a download filename:
    - Removes illegal filesystem chars: / \\ : * ? " < > | and control chars
    - Protects against Windows reserved filenames (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
    - Strips leading/trailing dots and spaces
    - Preserves UTF-8 international characters (CJK, Cyrillic, Indic, Arabic, etc.)
    - Caps name length while keeping extension intact
    """
    if not name:
        return fallback

    # Strip control characters
    name = "".join(ch for ch in name if ch.isprintable())
    # Replace illegal filesystem chars with hyphen
    name = re.sub(r'[/\\:*?"<>|\x00-\x1f]', "-", name)
    # Collapse multiple spaces or multiple hyphens
    name = re.sub(r"\s+", " ", name)
    name = re.sub(r"-+", "-", name).strip(" .-")

    if not name:
        name = fallback

    # Check for Windows reserved names
    parts = name.split(".")
    base = parts[0].upper()
    reserved_names = {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}
    if base in reserved_names:
        parts[0] = f"file_{parts[0]}"
        name = ".".join(parts)

    # Truncate length while preserving extension
    if len(name) > max_length:
        if "." in name:
            base, ext = name.rsplit(".", 1)
            keep_base_len = max(1, max_length - len(ext) - 1)
            name = f"{base[:keep_base_len].rstrip(' .')}.{ext}"
        else:
            name = name[:max_length].rstrip(" .")

    return name or fallback
