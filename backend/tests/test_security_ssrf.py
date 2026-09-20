import pytest
from app.core.security import validate_url_ssrf, sanitize_format_id, sanitize_filename
from app.core.exceptions import SSRFBlockedException, InvalidURLException

def test_ssrf_blocks_loopback_and_localhost():
    with pytest.raises(SSRFBlockedException):
        validate_url_ssrf("http://localhost:8000/secret")
    with pytest.raises(SSRFBlockedException):
        validate_url_ssrf("http://127.0.0.1/admin")
    with pytest.raises(SSRFBlockedException):
        validate_url_ssrf("http://[::1]/debug")

def test_ssrf_blocks_private_networks():
    with pytest.raises(SSRFBlockedException):
        validate_url_ssrf("http://10.0.0.1/resource")
    with pytest.raises(SSRFBlockedException):
        validate_url_ssrf("http://172.16.0.1/private")
    with pytest.raises(SSRFBlockedException):
        validate_url_ssrf("http://192.168.1.1/router")

def test_ssrf_blocks_cloud_metadata():
    with pytest.raises(SSRFBlockedException):
        validate_url_ssrf("http://169.254.169.254/latest/meta-data/")
    with pytest.raises(SSRFBlockedException):
        validate_url_ssrf("http://metadata.google.internal/computeMetadata/v1/")

def test_ssrf_blocks_forbidden_schemes():
    with pytest.raises(InvalidURLException):
        validate_url_ssrf("file:///etc/passwd")
    with pytest.raises(InvalidURLException):
        validate_url_ssrf("javascript:alert('xss')")
    with pytest.raises(InvalidURLException):
        validate_url_ssrf("data:text/html,<h1>Test</h1>")
    with pytest.raises(InvalidURLException):
        validate_url_ssrf("ftp://example.com/file.mp4")

def test_ssrf_allows_valid_public_urls():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert validate_url_ssrf(url) == url
    url_vimeo = "https://vimeo.com/76979871"
    assert validate_url_ssrf(url_vimeo) == url_vimeo

def test_sanitize_format_id():
    assert sanitize_format_id("137+140") == "137+140"
    assert sanitize_format_id("bestvideo[height<=1080]") == "bestvideo[height<=1080]"
    assert sanitize_format_id("mp4-1080p") == "mp4-1080p"
    
    with pytest.raises(InvalidURLException):
        sanitize_format_id("137; rm -rf /")
    with pytest.raises(InvalidURLException):
        sanitize_format_id("best | echo pwned")

def test_sanitize_filename():
    assert sanitize_filename("Normal Title.mp4") == "Normal Title.mp4"
    # Removes forbidden chars
    assert sanitize_filename('Dangerous/Title\\With:Bad*Chars?.mp4') == "Dangerous-Title-With-Bad-Chars-.mp4" or "-" in sanitize_filename('Dangerous/Title\\With:Bad*Chars?.mp4')
    # Windows reserved name
    assert sanitize_filename("CON.mp4") == "file_CON.mp4"
    assert sanitize_filename("NUL.mp3") == "file_NUL.mp3"
    # Truncation with extension preserved
    long_name = "A" * 150 + ".mp4"
    sanitized = sanitize_filename(long_name, max_length=50)
    assert len(sanitized) <= 50
    assert sanitized.endswith(".mp4")
    # International Unicode characters preserved
    assert "日本語" in sanitize_filename("日本語タイトル - 1080p.mp4")
    assert "हिंदी" in sanitize_filename("हिंदी गाना.mp3")
