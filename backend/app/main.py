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
from app.api.routes_file import router as file_router
from app.api.routes_auth import router as auth_router
from app.db.database import init_db

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

    # Initialize database tables in Docker DownZaro
    try:
        init_db()
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

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
app.include_router(auth_router)
app.include_router(url_router)
app.include_router(info_router)
app.include_router(stream_router)
app.include_router(download_router)
app.include_router(progress_router)
app.include_router(file_router)

# Mount static frontend build if present (Unified Full-Stack Mode)
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"message": "API endpoint not found"})
        candidate = os.path.join(dist_dir, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"message": "Frontend build not found"})
else:
    @app.get("/")
    async def root():
        return {
            "app": "DownZaro",
            "tagline": "Link it • Download it • Keep it",
            "status": "online"
        }
