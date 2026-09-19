import uuid
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from backend.app.config import settings
from backend.app.core.rate_limiter import rate_limiter, get_client_ip
from backend.app.core.security import validate_url_ssrf, resolve_redirects_safely
from backend.app.services.url_parser import normalize_media_url
from backend.app.services.ytdlp_service import ytdlp_service
from backend.app.services.format_processor import process_media_formats
from backend.app.services.stream_proxy import register_stream_url

router = APIRouter(tags=["Media Info"])

class InfoRequest(BaseModel):
    url: str = Field(..., max_length=4096)

@router.post("/api/info")
async def extract_media_info(req: InfoRequest, request: Request):
    ip = get_client_ip(request)
    rate_limiter.check(ip, settings.RATE_LIMIT_INFO_PER_MINUTE)

    # 1. URL Normalization & Scheme Validation
    parsed_info = normalize_media_url(req.url)

    # 2. Shortened URL resolution with SSRF checks on every hop
    resolved_url = await resolve_redirects_safely(parsed_info["canonical_url"])
    validate_url_ssrf(resolved_url)

    # 3. yt-dlp metadata extraction
    raw_metadata = await ytdlp_service.extract_metadata(resolved_url)

    # 4. Format processing and quality grouping
    processed = process_media_formats(raw_metadata)

    # 5. Create a secure stream token for seekable video preview
    stream_token = None
    if processed.get("preview_stream_url"):
        stream_token = str(uuid.uuid4())
        register_stream_url(stream_token, processed["preview_stream_url"])

    return {
        "success": True,
        "platform_id": parsed_info["platform_id"],
        "platform_name": parsed_info["platform_name"],
        "icon": parsed_info["icon"],
        "canonical_url": parsed_info["canonical_url"],
        "start_seconds": parsed_info["start_seconds"],
        "stream_token": stream_token,
        "preview_proxy_url": f"/api/stream/{stream_token}" if stream_token else None,
        "media": processed,
    }
