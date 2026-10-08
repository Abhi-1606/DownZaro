import pytest
from app.services.format_processor import process_media_formats

def test_maximum_quality_is_recommended():
    raw_info = {
        "id": "test1234567",
        "title": "Test 4K Video",
        "duration": 120,
        "extractor_key": "youtube",
        "formats": [
            {
                "format_id": "18",
                "height": 360,
                "fps": 30,
                "ext": "mp4",
                "vcodec": "avc1.42001E",
                "acodec": "mp4a.40.2",
                "url": "https://example.com/360p.mp4",
            },
            {
                "format_id": "22",
                "height": 720,
                "fps": 30,
                "ext": "mp4",
                "vcodec": "avc1.64001F",
                "acodec": "mp4a.40.2",
                "url": "https://example.com/720p.mp4",
            },
            {
                "format_id": "137",
                "height": 1080,
                "fps": 60,
                "ext": "mp4",
                "vcodec": "avc1.640028",
                "acodec": "none",
                "url": "https://example.com/1080p.mp4",
            },
            {
                "format_id": "313",
                "height": 2160,
                "fps": 60,
                "ext": "webm",
                "vcodec": "vp9",
                "acodec": "none",
                "url": "https://example.com/4k.webm",
            },
        ],
    }

    processed = process_media_formats(raw_info)
    video_formats = processed["video_formats"]

    # Maximum quality (4K) should be first and marked recommended
    assert len(video_formats) > 0
    assert video_formats[0]["height"] == 2160
    assert video_formats[0]["is_recommended"] is True

    # Check that other formats are not recommended
    for fmt in video_formats[1:]:
        assert fmt["is_recommended"] is False

    # Check preview stream is highest resolution stream with audio (720p)
    assert processed["preview_stream_url"] == "https://example.com/720p.mp4"
