import os
import re
import urllib.parse
import unicodedata
from fastapi import APIRouter
from fastapi.responses import FileResponse
from backend.app.services.download_manager import download_manager
from backend.app.core.exceptions import DownZaroException

router = APIRouter(tags=["File Delivery"])

def build_content_disposition_header(filename: str) -> str:
    """
    Builds an RFC 6266 and RFC 5987 compliant Content-Disposition header.
    - Fallback 'filename' parameter contains ONLY 7-bit ASCII characters.
    - 'filename*' parameter contains the full UTF-8 URL-encoded filename.
    Guaranteed to be 100% encodable in latin-1 / ascii HTTP headers.
    """
    # Replace common typographic unicode characters with ascii equivalents
    normalized = filename.replace('’', "'").replace('‘', "'")
    normalized = normalized.replace('“', "'").replace('”', "'")
    normalized = normalized.replace('–', '-').replace('—', '-')
    normalized = normalized.replace('\r', '').replace('\n', '')

    # Generate pure ASCII fallback
    ascii_clean = unicodedata.normalize('NFKD', normalized).encode('ascii', 'ignore').decode('ascii')
    # Remove quotes and dangerous characters from ascii fallback
    ascii_clean = re.sub(r'["\\]', '', ascii_clean).strip()
    if not ascii_clean:
        ascii_clean = "media_download"

    # RFC 5987 UTF-8 encoding (URL-encoded bytes, guaranteed pure ASCII)
    encoded_utf8 = urllib.parse.quote(filename.encode("utf-8"))

    return f'attachment; filename="{ascii_clean}"; filename*=UTF-8\'\'{encoded_utf8}'

@router.get("/api/file/{job_id}")
@router.head("/api/file/{job_id}")
async def download_file_endpoint(job_id: str):
    job = download_manager.get_job(job_id)
    if not job:
        raise DownZaroException(status_code=404, code="JOB_NOT_FOUND", message="Download job not found.")

    if job.get("status") != "ready":
        raise DownZaroException(status_code=400, code="NOT_READY", message="Download is not ready yet.")

    file_path = job.get("output_file_path")
    if not file_path or not os.path.exists(file_path):
        raise DownZaroException(status_code=404, code="FILE_NOT_FOUND", message="Finished file is no longer available on server.")

    raw_filename = job.get("filename") or os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    
    # Build bulletproof RFC 5987 header that never throws UnicodeEncodeError
    disposition = build_content_disposition_header(raw_filename)

    # Determine accurate media type
    media_type = "application/octet-stream"
    lower_name = raw_filename.lower()
    if lower_name.endswith(".mp4"):
        media_type = "video/mp4"
    elif lower_name.endswith(".mp3"):
        media_type = "audio/mpeg"
    elif lower_name.endswith(".m4a"):
        media_type = "audio/mp4"
    elif lower_name.endswith((".jpg", ".jpeg")):
        media_type = "image/jpeg"
    elif lower_name.endswith(".zip"):
        media_type = "application/zip"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={
            "Content-Disposition": disposition,
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        }
    )
