import re
import urllib.parse
from typing import Dict, Any, Optional, Tuple
import idna
from backend.app.core.exceptions import InvalidURLException, PlaylistNotAllowedException

# Common tracking parameters to strip for canonicalization
TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "si", "fbclid", "igshid", "gclid", "dclid", "msclkid", "ref_src",
    "feature", "context", "share_id", "s", "source", "ref", "sender_device"
}

# Regex to find URLs in arbitrary text
URL_REGEX = re.compile(
    r'(?:https?://|www\.)[^\s<>"\'{}|\\^`[\]]+',
    re.IGNORECASE
)

# Zero-width & invisible unicode characters
ZERO_WIDTH_CHARS = re.compile(r'[\u200B-\u200D\uFEFF\u00AD\u200E\u200F\u202A-\u202E]')

def clean_raw_input(text: str) -> str:
    """Strips zero-width characters, control characters, leading/trailing whitespace."""
    if not text:
        return ""
    cleaned = ZERO_WIDTH_CHARS.sub("", text)
    cleaned = "".join(c for c in cleaned if c.isprintable() or c in ("\n", "\r", "\t"))
    return cleaned.strip()

def parse_time_to_seconds(time_str: str) -> int:
    """Parses timestamps like 90, 1m30s, 1h20m30s, 01:30 into seconds."""
    if not time_str:
        return 0
    time_str = time_str.strip().lower()
    if time_str.isdigit():
        return int(time_str)

    # Format: 1h20m30s or 90s or 2m
    match_hms = re.match(r'^(?:(?P<hours>\d+)h)?(?:(?P<minutes>\d+)m)?(?:(?P<seconds>\d+)s?)?$', time_str)
    if match_hms and any(match_hms.groups()):
        h = int(match_hms.group("hours") or 0)
        m = int(match_hms.group("minutes") or 0)
        s = int(match_hms.group("seconds") or 0)
        return h * 3600 + m * 60 + s

    # Format: HH:MM:SS or MM:SS
    parts = time_str.split(":")
    if all(p.isdigit() for p in parts):
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])

    return 0

def extract_url_from_text(raw_input: str) -> Tuple[str, bool]:
    """
    Extracts the first valid URL from raw user input, handling pasted text with links,
    missing protocol, and detecting if multiple URLs were present.
    """
    cleaned = clean_raw_input(raw_input)
    if not cleaned:
        raise InvalidURLException("Input is empty. Please enter a valid video link.")

    if len(cleaned) > 4096:
        raise InvalidURLException("Input text exceeds maximum allowed length.")

    # Find all matches
    matches = URL_REGEX.findall(cleaned)
    has_multiple = len(matches) > 1

    if matches:
        target_url = matches[0]
    else:
        # Check if the whole cleaned string is a domain/path without scheme (e.g. youtube.com/watch?v=...)
        if re.match(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$', cleaned):
            target_url = cleaned
        else:
            raise InvalidURLException("No valid media link found in the provided text.")

    # Prepend https:// if missing
    if not target_url.startswith(("http://", "https://")):
        target_url = f"https://{target_url}"

    return target_url, has_multiple

def detect_platform_info(url_str: str) -> Dict[str, Any]:
    """Detects platform details, human-readable name, icon, and specific content type."""
    parsed = urllib.parse.urlparse(url_str)
    host = (parsed.hostname or "").lower()

    info = {
        "platform_id": "generic",
        "platform_name": "Web Media",
        "icon": "globe",
        "is_direct_file": False,
        "is_short": False,
        "is_playlist_only": False,
        "is_channel_only": False,
    }

    # Direct media file check
    if parsed.path.lower().endswith((".mp4", ".mp3", ".m3u8", ".webm", ".mkv", ".mov", ".wav", ".aac", ".ogg")):
        info["platform_id"] = "direct_file"
        info["platform_name"] = "Direct Media File"
        info["icon"] = "file-video"
        info["is_direct_file"] = True
        return info

    if any(h in host for h in ["youtube.com", "youtu.be"]):
        info["platform_id"] = "youtube"
        info["platform_name"] = "YouTube"
        info["icon"] = "youtube"
        if "/shorts/" in parsed.path:
            info["is_short"] = True
        elif parsed.path.startswith(("/playlist", "/channel/", "/c/", "/@", "/user/")) and "v=" not in parsed.query:
            info["is_playlist_only"] = True
    elif "instagram.com" in host or "instagr.am" in host:
        info["platform_id"] = "instagram"
        info["platform_name"] = "Instagram"
        info["icon"] = "instagram"
        if "/reel/" in parsed.path:
            info["is_short"] = True
    elif "tiktok.com" in host:
        info["platform_id"] = "tiktok"
        info["platform_name"] = "TikTok"
        info["icon"] = "tiktok"
        info["is_short"] = True
    elif any(h in host for h in ["facebook.com", "fb.watch", "fb.com"]):
        info["platform_id"] = "facebook"
        info["platform_name"] = "Facebook"
        info["icon"] = "facebook"
        if "/reel/" in parsed.path:
            info["is_short"] = True
    elif "twitter.com" in host or "x.com" in host:
        info["platform_id"] = "x"
        info["platform_name"] = "X / Twitter"
        info["icon"] = "twitter"
    elif "reddit.com" in host or "redd.it" in host:
        info["platform_id"] = "reddit"
        info["platform_name"] = "Reddit"
        info["icon"] = "reddit"
    elif "twitch.tv" in host:
        info["platform_id"] = "twitch"
        info["platform_name"] = "Twitch"
        info["icon"] = "twitch"
    elif "vimeo.com" in host:
        info["platform_id"] = "vimeo"
        info["platform_name"] = "Vimeo"
        info["icon"] = "vimeo"
    elif "dailymotion.com" in host or "dai.ly" in host:
        info["platform_id"] = "dailymotion"
        info["platform_name"] = "Dailymotion"
        info["icon"] = "dailymotion"
    elif "soundcloud.com" in host:
        info["platform_id"] = "soundcloud"
        info["platform_name"] = "SoundCloud"
        info["icon"] = "music"

    return info

def normalize_media_url(raw_input: str) -> Dict[str, Any]:
    """
    Full pipeline:
    1. Extracts URL from raw text
    2. Enforces scheme and length restrictions
    3. Detects platform and flags pure playlists/channels
    4. Extracts timestamp (?t=...) for player seek position
    5. Strips tracking params & isolates single video from watch playlist URLs
    6. Returns structured payload with canonical URL and metadata.
    """
    url_str, had_multiple = extract_url_from_text(raw_input)

    parsed = urllib.parse.urlparse(url_str)
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        raise InvalidURLException(f"Scheme '{scheme}' is not supported.")

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise InvalidURLException("URL contains no valid host.")

    # Convert IDN hostname to Punycode
    try:
        encoded_host = idna.encode(hostname).decode("ascii")
    except Exception:
        encoded_host = hostname

    platform_info = detect_platform_info(url_str)

    # Detect pure playlists or channel links
    if platform_info["is_playlist_only"]:
        raise PlaylistNotAllowedException("This is a playlist/channel link. Please paste a link to a single video.")

    # Parse query parameters
    query_params = urllib.parse.parse_qs(parsed.query, keep_blank_values=False)
    
    # Extract timestamp if present
    start_seconds = 0
    for time_key in ("t", "start", "time_continue"):
        if time_key in query_params:
            start_seconds = parse_time_to_seconds(query_params[time_key][0])
            del query_params[time_key]

    # Handle YouTube specific normalization
    clean_path = parsed.path
    if platform_info["platform_id"] == "youtube":
        # Short URL youtu.be/<id>
        if "youtu.be" in hostname:
            video_id = clean_path.strip("/")
            clean_path = "/watch"
            query_params = {"v": [video_id]}
        # /shorts/<id> or /embed/<id> or /live/<id>
        elif any(clean_path.startswith(prefix) for prefix in ("/shorts/", "/embed/", "/live/")):
            parts = clean_path.strip("/").split("/")
            if len(parts) >= 2:
                video_id = parts[1]
                clean_path = "/watch"
                query_params = {"v": [video_id]}
        # If playlist param is present in a watch URL, strip &list= to download single video
        if "list" in query_params:
            del query_params["list"]
        if "index" in query_params:
            del query_params["index"]

    # Filter out tracking query params
    filtered_query = {}
    for key, values in query_params.items():
        if key.lower() not in TRACKING_PARAMS:
            filtered_query[key] = values

    # Build canonical query string
    new_query = urllib.parse.urlencode(filtered_query, doseq=True)

    # Reassemble canonical URL
    canonical_url = urllib.parse.urlunparse((
        scheme,
        encoded_host + (f":{parsed.port}" if parsed.port else ""),
        clean_path,
        "",
        new_query,
        ""
    ))

    return {
        "original_input": raw_input,
        "canonical_url": canonical_url,
        "platform_id": platform_info["platform_id"],
        "platform_name": platform_info["platform_name"],
        "icon": platform_info["icon"],
        "is_short": platform_info["is_short"],
        "is_direct_file": platform_info["is_direct_file"],
        "start_seconds": start_seconds,
        "had_multiple_urls": had_multiple,
    }
