import pytest
from app.services.url_parser import (
    clean_raw_input,
    parse_time_to_seconds,
    extract_url_from_text,
    normalize_media_url
)
from app.core.exceptions import InvalidURLException, PlaylistNotAllowedException

def test_clean_raw_input():
    dirty = "  \u200Bhttps://example.com/video\uFEFF   "
    assert clean_raw_input(dirty) == "https://example.com/video"

def test_parse_time_to_seconds():
    assert parse_time_to_seconds("90") == 90
    assert parse_time_to_seconds("1m30s") == 90
    assert parse_time_to_seconds("2h10m5s") == 2 * 3600 + 10 * 60 + 5
    assert parse_time_to_seconds("01:30") == 90
    assert parse_time_to_seconds("01:00:15") == 3615

def test_extract_url_from_text():
    url, multiple = extract_url_from_text("check this out https://www.youtube.com/watch?v=12345 cool video")
    assert url == "https://www.youtube.com/watch?v=12345"
    assert not multiple

    # Multiple links
    url2, multiple2 = extract_url_from_text("https://youtu.be/abc and https://youtu.be/def")
    assert url2 == "https://youtu.be/abc"
    assert multiple2

    # Missing scheme
    url3, _ = extract_url_from_text("youtube.com/watch?v=12345")
    assert url3 == "https://youtube.com/watch?v=12345"

def test_normalize_youtube_short_and_tracking():
    raw = "https://youtu.be/dQw4w9WgXcQ?si=abcdef123&utm_source=twitter&t=45"
    res = normalize_media_url(raw)
    assert res["platform_id"] == "youtube"
    assert res["start_seconds"] == 45
    assert "si=" not in res["canonical_url"]
    assert "utm_source" not in res["canonical_url"]
    assert "v=dQw4w9WgXcQ" in res["canonical_url"]

def test_normalize_youtube_playlist_param_stripped():
    raw = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&index=1"
    res = normalize_media_url(raw)
    assert "list=" not in res["canonical_url"]
    assert "index=" not in res["canonical_url"]
    assert "v=dQw4w9WgXcQ" in res["canonical_url"]

def test_reject_pure_playlist():
    raw = "https://www.youtube.com/playlist?list=PL123456789"
    with pytest.raises(PlaylistNotAllowedException):
        normalize_media_url(raw)

def test_normalize_tiktok_and_instagram():
    ig_raw = "https://www.instagram.com/reel/C8xyz123/?igshid=abc1234"
    ig_res = normalize_media_url(ig_raw)
    assert ig_res["platform_id"] == "instagram"
    assert ig_res["is_short"] is True
    assert "igshid" not in ig_res["canonical_url"]

    tt_raw = "https://www.tiktok.com/@user/video/7123456789?sender_device=pc"
    tt_res = normalize_media_url(tt_raw)
    assert tt_res["platform_id"] == "tiktok"
    assert "sender_device" not in tt_res["canonical_url"]
