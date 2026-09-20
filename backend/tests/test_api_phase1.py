import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["app"] == "DownZaro"
    assert data["status"] == "online"

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["ytdlp_installed"] is True
    assert data["ffmpeg_installed"] is True
    assert data["status"] == "healthy"

def test_validate_url_valid():
    res = client.post("/api/validate-url", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=12345"})
    assert res.status_code == 200
    data = res.json()
    assert data["platform_id"] == "youtube"
    assert "si=" not in data["canonical_url"]

def test_validate_url_ssrf_blocked():
    res = client.post("/api/validate-url", json={"url": "http://127.0.0.1:8000/internal"})
    assert res.status_code == 403
    data = res.json()
    assert data["code"] == "SSRF_BLOCKED"

def test_validate_url_playlist_rejected():
    res = client.post("/api/validate-url", json={"url": "https://www.youtube.com/playlist?list=PL123"})
    assert res.status_code == 400
    data = res.json()
    assert data["code"] == "PLAYLIST_LINK"
