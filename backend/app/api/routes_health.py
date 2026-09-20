from fastapi import APIRouter
from app.config import settings
from app.services.system_checker import verify_system_dependencies
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/api/health", response_model=HealthResponse)
async def health_check():
    diagnostics = verify_system_dependencies()
    is_healthy = diagnostics["ytdlp_installed"] and diagnostics["ffmpeg_installed"]
    
    return HealthResponse(
        status="healthy" if is_healthy else "degraded",
        ytdlp_installed=diagnostics["ytdlp_installed"],
        ytdlp_version=diagnostics["ytdlp_version"],
        ffmpeg_installed=diagnostics["ffmpeg_installed"],
        ffmpeg_version=diagnostics["ffmpeg_version"],
        max_duration_seconds=settings.MAX_DURATION_SECONDS,
        max_file_size_mb=settings.MAX_DOWNLOAD_FILE_SIZE_MB,
        temp_dir=settings.TEMP_DIR,
    )
