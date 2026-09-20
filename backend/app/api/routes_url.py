from fastapi import APIRouter, Request
from app.config import settings
from app.core.rate_limiter import rate_limiter, get_client_ip
from app.core.security import validate_url_ssrf, resolve_redirects_safely
from app.services.url_parser import normalize_media_url
from app.models.schemas import URLParseRequest, URLParseResponse

router = APIRouter(tags=["URL"])

@router.post("/api/validate-url", response_model=URLParseResponse)
async def validate_url_endpoint(req: URLParseRequest, request: Request):
    ip = get_client_ip(request)
    rate_limiter.check(ip, settings.RATE_LIMIT_INFO_PER_MINUTE)
    
    # Normalize URL structure
    parsed_info = normalize_media_url(req.url)
    
    # Resolve shortened URLs if any (bit.ly, t.co, etc.)
    resolved_url = await resolve_redirects_safely(parsed_info["canonical_url"])
    
    # Enforce SSRF validation
    validate_url_ssrf(resolved_url)
    
    # If redirect modified the URL, update canonical URL
    if resolved_url != parsed_info["canonical_url"]:
        parsed_info = normalize_media_url(resolved_url)

    return URLParseResponse(**parsed_info)
