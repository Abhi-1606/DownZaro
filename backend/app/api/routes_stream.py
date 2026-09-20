from fastapi import APIRouter, Request
from app.core.exceptions import DownZaroException
from app.services.stream_proxy import get_stream_url, proxy_media_stream

router = APIRouter(tags=["Stream Proxy"])

@router.get("/api/stream/{stream_token}")
async def stream_media_endpoint(stream_token: str, request: Request):
    media_url = get_stream_url(stream_token)
    if not media_url:
        raise DownZaroException(
            status_code=404,
            code="STREAM_EXPIRED",
            message="Preview stream link has expired or is invalid. Please refresh the page.",
            retryable=True
        )

    return await proxy_media_stream(media_url, request)
