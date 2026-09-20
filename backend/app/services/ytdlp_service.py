import os
import time
import asyncio
import logging
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

from app.config import settings
from app.core.exceptions import (
    DownZaroException,
    MediaNotFoundException,
    DRMProtectedException,
    LiveStreamException,
    UnsupportedPlatformException,
)

logger = logging.getLogger("downzaro.ytdlp")

METADATA_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 600

# Thread pool for running sync yt_dlp calls without blocking the event loop
_executor = ThreadPoolExecutor(max_workers=4)


class YtDlpService:
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

    def _extract_sync(self, canonical_url: str) -> Dict[str, Any]:
        """
        Runs yt_dlp metadata extraction synchronously using the Python API
        (no subprocess). Safe to call from a ThreadPoolExecutor.
        """
        import yt_dlp  # imported here to avoid heavy import at module load

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "noplaylist": True,
            "no_color": True,
            "socket_timeout": 20,
        }

        # Add cookies file if configured
        if settings.COOKIES_FILE_PATH and os.path.exists(settings.COOKIES_FILE_PATH):
            ydl_opts["cookiefile"] = settings.COOKIES_FILE_PATH

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(canonical_url, download=False)
            except yt_dlp.utils.DownloadError as e:
                self._handle_extraction_error(str(e))
            except Exception as e:
                raise DownZaroException(
                    status_code=502,
                    code="EXTRACTION_FAILED",
                    message="Could not process video link. The platform may have changed or the link is invalid.",
                    retryable=True,
                )

        if not info:
            raise MediaNotFoundException("No media information returned for this link.")

        if info.get("is_live") is True:
            raise LiveStreamException("This video is currently broadcasting live. Live recording is not supported.")
        if info.get("live_status") == "is_upcoming":
            raise DownZaroException(
                status_code=400,
                code="UPCOMING_PREMIERE",
                message="This video is an upcoming premiere and hasn't started yet.",
                retryable=False,
            )

        return info

    async def extract_metadata(self, canonical_url: str, timeout_sec: int = 30) -> Dict[str, Any]:
        cached = self._get_cache(canonical_url)
        if cached:
            logger.info(f"Returning cached metadata for {canonical_url}")
            return cached

        logger.info(f"Extracting metadata with yt_dlp Python API for {canonical_url}")

        loop = asyncio.get_event_loop()
        try:
            data = await asyncio.wait_for(
                loop.run_in_executor(_executor, self._extract_sync, canonical_url),
                timeout=timeout_sec,
            )
        except asyncio.TimeoutError:
            raise DownZaroException(
                status_code=504,
                code="EXTRACTION_TIMEOUT",
                message="Metadata extraction took too long. Please retry.",
                retryable=True,
            )
        # Let DownZaroException propagate as-is
        except DownZaroException:
            raise
        except Exception as e:
            logger.error(f"Unexpected extraction error: {e}", exc_info=True)
            raise DownZaroException(
                status_code=502,
                code="EXTRACTION_FAILED",
                message="Could not process video link. The platform may have changed or the link is invalid.",
                retryable=True,
            )

        self._set_cache(canonical_url, data)
        return data

    def _handle_extraction_error(self, err_msg: str):
        lower_err = err_msg.lower()
        if "drm" in lower_err or "protected" in lower_err:
            raise DRMProtectedException("This content is DRM-protected and cannot be downloaded.")
        elif "private video" in lower_err or "this video is private" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="PRIVATE_VIDEO",
                message="This video is private and cannot be accessed.",
                retryable=False,
            )
        elif "login" in lower_err or "sign in" in lower_err or "bot" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="LOGIN_REQUIRED",
                message="This video requires user login or authentication.",
                retryable=False,
            )
        elif "age" in lower_err and ("restricted" in lower_err or "gate" in lower_err):
            raise DownZaroException(
                status_code=403,
                code="AGE_RESTRICTED",
                message="This video is age-restricted and requires account verification.",
                retryable=False,
            )
        elif "country" in lower_err or "geo" in lower_err or "not available in your country" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="GEO_BLOCKED",
                message="This video is not available in the current region.",
                retryable=False,
            )
        elif "copyright" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="COPYRIGHT_BLOCKED",
                message="This video is unavailable due to copyright restrictions.",
                retryable=False,
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
                retryable=True,
            )


ytdlp_service = YtDlpService()
