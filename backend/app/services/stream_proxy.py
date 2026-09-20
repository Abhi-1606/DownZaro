import logging
import httpx
from typing import Optional, AsyncGenerator
from fastapi import Request, Response
from fastapi.responses import StreamingResponse
from app.core.exceptions import DownZaroException

logger = logging.getLogger("downzaro.stream")

# Session Store: stream_token -> stream_url
STREAM_SESSION_STORE = {}

def register_stream_url(token: str, media_url: str):
    """Registers a validated media stream URL for secure proxied streaming."""
    # Keep store bounded
    if len(STREAM_SESSION_STORE) > 500:
        STREAM_SESSION_STORE.clear()
    STREAM_SESSION_STORE[token] = media_url

def get_stream_url(token: str) -> Optional[str]:
    return STREAM_SESSION_STORE.get(token)

async def proxy_media_stream(media_url: str, request: Request) -> Response:
    """
    Proxies remote media URL to browser with RFC 7233 HTTP Range support for seeking.
    """
    range_header = request.headers.get("Range")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
    }
    if range_header:
        headers["Range"] = range_header

    try:
        client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        upstream_req = client.build_request("GET", media_url, headers=headers)
        upstream_res = await client.send(upstream_req, stream=True)

        status_code = upstream_res.status_code
        if status_code not in (200, 206):
            await upstream_res.aclose()
            await client.aclose()
            raise DownZaroException(
                status_code=502,
                code="STREAM_ERROR",
                message="Upstream media provider returned an error while streaming.",
                retryable=True
            )

        async def stream_generator() -> AsyncGenerator[bytes, None]:
            try:
                async for chunk in upstream_res.aiter_bytes(chunk_size=65536):
                    yield chunk
            finally:
                await upstream_res.aclose()
                await client.aclose()

        response_headers = {
            "Accept-Ranges": "bytes",
            "Content-Type": upstream_res.headers.get("Content-Type", "video/mp4"),
            "Cache-Control": "public, max-age=3600",
        }
        if "Content-Range" in upstream_res.headers:
            response_headers["Content-Range"] = upstream_res.headers["Content-Range"]
        if "Content-Length" in upstream_res.headers:
            response_headers["Content-Length"] = upstream_res.headers["Content-Length"]

        return StreamingResponse(
            stream_generator(),
            status_code=status_code,
            headers=response_headers,
            media_type=response_headers["Content-Type"]
        )

    except Exception as e:
        logger.error(f"Error during stream proxying: {e}")
        raise DownZaroException(
            status_code=502,
            code="STREAM_PROXY_FAILED",
            message="Could not stream preview video.",
            retryable=True
        )
