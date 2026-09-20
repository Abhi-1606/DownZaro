"""
routes_stream_download.py
─────────────────────────
Vercel-compatible download endpoint.

Instead of spawning a background job + SSE, this route:
  1. Uses the yt_dlp Python API to resolve the best download URL
  2. Proxies (streams) the media bytes directly to the browser in one HTTP response

This works within Vercel's serverless constraints because:
  - No subprocess is spawned (no yt-dlp binary needed)
  - No persistent state across invocations (stateless)
  - The streaming response is piped through within the function's execution window
  - For larger files the client receives a redirect to the direct CDN URL instead,
    avoiding the 10-second Vercel timeout entirely

NOTE: The original job-based download system (`/api/download`) still works
      locally where long-running processes are fine.
"""

import os
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, RedirectResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.core.rate_limiter import rate_limiter, get_client_ip
from app.core.security import validate_url_ssrf
from app.core.exceptions import DownZaroException
from app.services.url_parser import normalize_media_url

logger = logging.getLogger("downzaro.stream_download")

router = APIRouter(tags=["Stream Download"])


class StreamDownloadRequest(BaseModel):
    url: str = Field(..., max_length=4096)
    format_type: str = Field("video", description="'video' or 'audio'")
    format_id: Optional[str] = None
    audio_id: Optional[str] = None


def _resolve_best_url(canonical_url: str, format_type: str, format_id: Optional[str], audio_id: Optional[str]) -> tuple[str, str]:
    """
    Uses yt_dlp Python API to resolve the direct CDN URL for the requested format.
    Returns (direct_url, suggested_filename).
    Runs synchronously — call from a thread executor if needed.
    """
    import yt_dlp  # lazy import

    # Build format selector
    if format_type == "audio":
        fmt = "bestaudio[ext=m4a]/bestaudio/best"
    elif format_id:
        fmt = f"{format_id}+bestaudio/best[ext=mp4]/best"
    else:
        fmt = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best"

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "format": fmt,
        "socket_timeout": 20,
    }

    if settings.COOKIES_FILE_PATH and os.path.exists(settings.COOKIES_FILE_PATH):
        ydl_opts["cookiefile"] = settings.COOKIES_FILE_PATH

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(canonical_url, download=False)
        except yt_dlp.utils.DownloadError as e:
            raise DownZaroException(
                status_code=400,
                code="EXTRACTION_FAILED",
                message=f"Could not resolve download URL: {str(e)[:200]}",
                retryable=True,
            )

    if not info:
        raise DownZaroException(status_code=404, code="NOT_FOUND", message="Could not resolve media URL.")

    # For playlists / merged formats, yt_dlp may nest under 'requested_formats'
    requested = info.get("requested_formats") or [info]
    # We want the primary (video) or single-stream URL
    primary = requested[0] if requested else info
    direct_url = primary.get("url") or info.get("url")

    if not direct_url:
        raise DownZaroException(
            status_code=502,
            code="NO_STREAM_URL",
            message="Could not get a direct stream URL for this media.",
            retryable=True,
        )

    title = info.get("title", "media")
    ext = primary.get("ext") or ("mp3" if format_type == "audio" else "mp4")
    # Sanitize title for filename
    safe_title = "".join(c if c.isalnum() or c in " -_()[]." else "_" for c in title)[:80]
    filename = f"{safe_title}.{ext}"

    return direct_url, filename


@router.post("/api/stream-download")
async def stream_download(req: StreamDownloadRequest, request: Request):
    """
    Resolves and redirects to the direct CDN URL for the media.
    The browser downloads it natively — no file is stored on the server.
    This is Vercel-safe because the function only needs to resolve the URL,
    then the client streams directly from YouTube/CDN.
    """
    ip = get_client_ip(request)
    rate_limiter.check(ip, settings.RATE_LIMIT_DOWNLOAD_PER_MINUTE)

    parsed = normalize_media_url(req.url)
    validate_url_ssrf(parsed["canonical_url"])

    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    loop = asyncio.get_event_loop()

    _ex = ThreadPoolExecutor(max_workers=2)
    try:
        direct_url, filename = await asyncio.wait_for(
            loop.run_in_executor(
                _ex,
                _resolve_best_url,
                parsed["canonical_url"],
                req.format_type,
                req.format_id,
                req.audio_id,
            ),
            timeout=25,
        )
    except asyncio.TimeoutError:
        raise DownZaroException(
            status_code=504,
            code="RESOLVE_TIMEOUT",
            message="Could not resolve download URL in time. Please retry.",
            retryable=True,
        )
    finally:
        _ex.shutdown(wait=False)

    # Return the resolved CDN URL + filename to the frontend.
    # The frontend opens this URL directly — no proxying needed.
    return {
        "success": True,
        "direct_url": direct_url,
        "filename": filename,
        "format_type": req.format_type,
    }
