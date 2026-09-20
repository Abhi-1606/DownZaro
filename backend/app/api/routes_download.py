from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.config import settings
from app.core.rate_limiter import rate_limiter, get_client_ip
from app.core.security import validate_url_ssrf, sanitize_format_id
from app.services.url_parser import normalize_media_url
from app.services.download_manager import download_manager
from app.core.exceptions import DownZaroException

router = APIRouter(tags=["Downloads"])

class DownloadRequest(BaseModel):
    url: str = Field(..., max_length=4096)
    title: str = Field(..., max_length=300)
    video_id: str = Field(..., max_length=100)
    extractor_key: str = Field(..., max_length=100)
    format_type: str = Field("video", description="'video', 'audio', 'thumbnail', or 'all_in_one'")
    format_id: Optional[str] = None
    audio_id: Optional[str] = None
    thumb_id: Optional[str] = None
    thumbnail_url: Optional[str] = None

@router.post("/api/download")
async def start_download(req: DownloadRequest, request: Request):
    ip = get_client_ip(request)
    rate_limiter.check(ip, settings.RATE_LIMIT_DOWNLOAD_PER_MINUTE)

    # 1. Normalize and re-verify SSRF
    parsed_info = normalize_media_url(req.url)
    validate_url_ssrf(parsed_info["canonical_url"])

    # 2. Sanitize format ID
    if req.format_id:
        sanitize_format_id(req.format_id)

    # 3. Create and launch job
    job = download_manager.create_job(
        client_ip=ip,
        canonical_url=parsed_info["canonical_url"],
        title=req.title,
        video_id=req.video_id,
        extractor_key=req.extractor_key,
        format_type=req.format_type,
        format_id=req.format_id,
        audio_id=req.audio_id,
        thumb_id=req.thumb_id,
        thumbnail_url=req.thumbnail_url
    )

    return {
        "success": True,
        "job_id": job["job_id"],
        "status": job["status"],
        "stage_label": job["stage_label"],
    }

@router.post("/api/cancel/{job_id}")
async def cancel_download_job(job_id: str):
    job = download_manager.get_job(job_id)
    if not job:
        raise DownZaroException(status_code=404, code="JOB_NOT_FOUND", message="Job not found.")
    await download_manager.cancel_job(job_id)
    return {"success": True, "job_id": job_id, "status": "cancelled"}

@router.get("/api/job/{job_id}")
async def get_job_status(job_id: str):
    job = download_manager.get_job(job_id)
    if not job:
        raise DownZaroException(status_code=404, code="JOB_NOT_FOUND", message="Job not found.")
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "stage_label": job["stage_label"],
        "progress_percent": job["progress_percent"],
        "speed": job["speed_str"],
        "eta": job["eta_str"],
        "filename": job["filename"],
        "error": job["error_message"],
        "download_url": f"/api/file/{job_id}" if job["status"] == "ready" else None,
    }
