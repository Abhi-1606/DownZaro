import os
import json
import time
import asyncio
import logging
import shutil
from typing import Dict, Any, Optional
from app.config import settings
from app.core.exceptions import (
    DownZaroException,
    MediaNotFoundException,
    DRMProtectedException,
    LiveStreamException,
    UnsupportedPlatformException,
)
from app.services.system_checker import get_ffmpeg_binary_path, setup_ffmpeg_symlinks

logger = logging.getLogger("downzaro.ytdlp")

METADATA_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 600

class YtDlpService:
    def __init__(self):
        self.ytdlp_bin = shutil.which("yt-dlp") or shutil.which("yt_dlp") or "yt-dlp"
        self.ffmpeg_dir = setup_ffmpeg_symlinks()
        self.ffmpeg_bin = get_ffmpeg_binary_path()

    def _get_cache(self, canonical_url: str) -> Optional[Dict[str, Any]]:
        entry = METADATA_CACHE.get(canonical_url)
        if entry and (time.time() - entry["timestamp"] < CACHE_TTL_SECONDS):
            return entry["data"]
        return None

    def _set_cache(self, canonical_url: str, data: Dict[str, Any]):
        if len(METADATA_CACHE) > 200:
            oldest_key = min(METADATA_CACHE.keys(), key=lambda k: METADATA_CACHE[k]["timestamp"])
            del METADATA_CACHE[oldest_key]
        METADATA_CACHE[canonical_url] = {"timestamp": time.time(), "data": data}

    async def extract_metadata(self, canonical_url: str, timeout_sec: int = 30) -> Dict[str, Any]:
        cached = self._get_cache(canonical_url)
        if cached:
            logger.info(f"Returning cached metadata for {canonical_url}")
            return cached

        args = [
            self.ytdlp_bin,
            "--ffmpeg-location", self.ffmpeg_dir,
            "--dump-single-json",
            "--skip-download",
            "--no-playlist",
            "--no-warnings",
            "--no-call-home",
            "--no-check-certificates",
            "--socket-timeout", "20",
        ]

        node_bin = shutil.which("node")
        if node_bin:
            args.extend(["--js-runtimes", f"node:{node_bin}"])

        if settings.COOKIES_FILE_PATH and os.path.exists(settings.COOKIES_FILE_PATH):
            args.extend(["--cookies", settings.COOKIES_FILE_PATH])

        args.extend(["--", canonical_url])

        custom_env = os.environ.copy()
        custom_env["PATH"] = f"{self.ffmpeg_dir}:{custom_env.get('PATH', '')}"

        logger.info(f"Extracting metadata with yt-dlp for {canonical_url}")

        try:
            proc = await asyncio.create_subprocess_exec(
                *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=custom_env
            )

            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout_sec)
            except asyncio.TimeoutError:
                try:
                    proc.kill()
                except Exception:
                    pass
                raise DownZaroException(
                    status_code=504,
                    code="EXTRACTION_TIMEOUT",
                    message="Metadata extraction took too long. Please retry.",
                    retryable=True
                )

            if proc.returncode != 0:
                err_msg = stderr.decode("utf-8", errors="ignore").strip()
                logger.warning(f"yt-dlp extraction failed with code {proc.returncode}: {err_msg}")
                self._handle_extraction_error(err_msg)

            output_str = stdout.decode("utf-8", errors="ignore").strip()
            if not output_str:
                raise MediaNotFoundException("No media information returned for this link.")

            data = json.loads(output_str)

            if data.get("is_live") is True:
                raise LiveStreamException("This video is currently broadcasting live. Live recording is not supported.")
            if data.get("live_status") == "is_upcoming":
                raise DownZaroException(
                    status_code=400,
                    code="UPCOMING_PREMIERE",
                    message="This video is an upcoming premiere and hasn't started yet.",
                    retryable=False
                )

            self._set_cache(canonical_url, data)
            return data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse yt-dlp JSON: {e}")
            raise DownZaroException(
                status_code=502,
                code="BAD_METADATA",
                message="Received invalid metadata from video extractor.",
                retryable=True
            )

    def _handle_extraction_error(self, err_msg: str):
        lower_err = err_msg.lower()
        if "drm" in lower_err or "protected" in lower_err:
            raise DRMProtectedException("This content is DRM-protected and cannot be downloaded.")
        elif "private video" in lower_err or "this video is private" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="PRIVATE_VIDEO",
                message="This video is private and cannot be accessed.",
                retryable=False
            )
        elif "login" in lower_err or "sign in" in lower_err or "bot" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="LOGIN_REQUIRED",
                message="This video requires user login or authentication.",
                retryable=False
            )
        elif "age" in lower_err and ("restricted" in lower_err or "gate" in lower_err):
            raise DownZaroException(
                status_code=403,
                code="AGE_RESTRICTED",
                message="This video is age-restricted and requires account verification.",
                retryable=False
            )
        elif "country" in lower_err or "geo" in lower_err or "not available in your country" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="GEO_BLOCKED",
                message="This video is not available in the current region.",
                retryable=False
            )
        elif "copyright" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="COPYRIGHT_BLOCKED",
                message="This video is unavailable due to copyright restrictions.",
                retryable=False
            )
        elif "removed" in lower_err or "deleted" in lower_err or "not found" in lower_err or "404" in lower_err:
            raise MediaNotFoundException("This video was deleted or cannot be found.")
        elif "unsupported url" in lower_err:
            raise UnsupportedPlatformException("This website or link format is not supported.")
        else:
            raise DownZaroException(
                status_code=400,
                code="EXTRACTION_FAILED",
                message="Could not process video link. The platform may have changed or the link is invalid.",
                detail=err_msg[:200],
                retryable=True
            )

ytdlp_service = YtDlpService()
