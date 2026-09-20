import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.core.exceptions import DownZaroException
from app.services.system_checker import verify_system_dependencies
from app.services.storage_cleaner import cleanup_expired_temp_files

from app.api.routes_health import router as health_router
from app.api.routes_url import router as url_router
from app.api.routes_info import router as info_router
from app.api.routes_stream import router as stream_router
from app.api.routes_download import router as download_router
from app.api.routes_progress import router as progress_router
from app.api.routes_stream_download import router as stream_download_router
from app.api.routes_file import router as file_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("downzaro")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DownZaro Backend Server...")
    try:
        diagnostics = verify_system_dependencies()
        if not diagnostics["ytdlp_installed"]:
            logger.warning("⚠️  yt-dlp is not detected or executable. Please install yt-dlp.")
        if not diagnostics["ffmpeg_installed"]:
            logger.warning("⚠️  ffmpeg is not detected or executable. Media merging may be degraded.")
    except Exception as e:
        logger.warning(f"Startup diagnostic check warning: {e}")

    # Start background cleaner task
    cleaner_task = None
    try:
        cleaner_task = asyncio.create_task(cleanup_expired_temp_files())
    except Exception:
        pass
    
    yield

    if cleaner_task:
        cleaner_task.cancel()
    logger.info("Shutting down DownZaro Backend Server...")

app = FastAPI(
    title="DownZaro API",
    description="Clean, Fast, Secure Media Downloader API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler for DownZaro structured exceptions
@app.exception_handler(DownZaroException)
async def downzaro_exception_handler(request: Request, exc: DownZaroException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content=detail
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Invalid request payload format.",
            "detail": str(exc.errors()),
            "retryable": False
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected server error occurred. Please try again shortly.",
            "detail": "Server encountered an internal error.",
            "retryable": True
        }
    )

# Include All Routers
app.include_router(health_router)
app.include_router(url_router)
app.include_router(info_router)
app.include_router(stream_router)
app.include_router(download_router)
app.include_router(progress_router)
app.include_router(file_router)
app.include_router(stream_download_router)

@app.get("/")
async def root():
    return {
        "app": "DownZaro",
        "tagline": "Link it • Download it • Keep it",
        "status": "online"
    }
