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

    async def extract_metadata(self, canonical_url: str, timeout_sec: int = 35) -> Dict[str, Any]:
        cached = self._get_cache(canonical_url)
        if cached:
            logger.info(f"Returning cached metadata for {canonical_url}")
            return cached

        # Multi-strategy client profiles to bypass platform rate-limits, anti-bot challenges, and client gating
        strategies = [
            # Strategy 1: PO-Token Powered Web + Mobile clients (Solves bot challenge)
            [
                "--extractor-args", "youtubepot-bgutilhttp:base_url=http://127.0.0.1:4416;youtube:player_client=web,mweb,ios",
                "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            ],
            # Strategy 2: Web PO-Token Client
            [
                "--extractor-args", "youtubepot-bgutilhttp:base_url=http://127.0.0.1:4416;youtube:player_client=web",
                "--user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            ],
            # Strategy 3: Mobile Native App Clients
            [
                "--extractor-args", "youtube:player_client=android,ios,tv",
                "--user-agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
            ],
            # Strategy 4: Clean generic fallback
            [
                "--user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            ]
        ]

        last_error_msg = ""
        node_bin = shutil.which("node")
        custom_env = os.environ.copy()
        custom_env["PATH"] = f"{self.ffmpeg_dir}:{custom_env.get('PATH', '')}"

        for idx, strategy_args in enumerate(strategies):
            args = [
                self.ytdlp_bin,
                "--ffmpeg-location", self.ffmpeg_dir,
                "--dump-single-json",
                "--skip-download",
                "--no-playlist",
                "--no-warnings",
                "--no-check-certificates",
                "--geo-bypass",
                "--add-header", "Accept-Language:en-US,en;q=0.9",
                "--socket-timeout", "20",
            ]

            if node_bin:
                args.extend(["--js-runtimes", f"node:{node_bin}"])

            if settings.COOKIES_FILE_PATH and os.path.exists(settings.COOKIES_FILE_PATH):
                args.extend(["--cookies", settings.COOKIES_FILE_PATH])

            args.extend(strategy_args)
            args.extend(["--", canonical_url])

            logger.info(f"Extracting metadata (attempt {idx + 1}/{len(strategies)}) for {canonical_url}")

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
                    if idx == len(strategies) - 1:
                        raise DownZaroException(
                            status_code=504,
                            code="EXTRACTION_TIMEOUT",
                            message="Metadata extraction took too long. Please retry.",
                            retryable=True
                        )
                    continue

                if proc.returncode == 0 and stdout:
                    output_str = stdout.decode("utf-8", errors="ignore").strip()
                    if output_str:
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

                err_msg = stderr.decode("utf-8", errors="ignore").strip()
                last_error_msg = err_msg
                logger.warning(f"yt-dlp extraction attempt {idx + 1} failed: {err_msg[:200]}")

            except (json.JSONDecodeError, DownZaroException):
                raise
            except Exception as ex:
                logger.warning(f"Extraction attempt {idx + 1} encountered exception: {ex}")
                last_error_msg = str(ex)

        self._handle_extraction_error(last_error_msg)

    def _handle_extraction_error(self, err_msg: str):
        lower_err = err_msg.lower()
        if "drm" in lower_err or "protected" in lower_err:
            raise DRMProtectedException("This content is DRM-protected and cannot be downloaded.")
        elif "private video" in lower_err or "this video is private" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="PRIVATE_VIDEO",
                message="This video is private or restricted and cannot be accessed.",
                retryable=False
            )
        elif "bot" in lower_err or "captcha" in lower_err:
            raise DownZaroException(
                status_code=429,
                code="BOT_CHALLENGE",
                message="The platform is temporarily rate-limiting requests. Please retry in a few moments.",
                retryable=True
            )
        elif "login" in lower_err or "sign in" in lower_err or "cookies" in lower_err:
            raise DownZaroException(
                status_code=403,
                code="LOGIN_REQUIRED",
                message="This video requires login or is private. Please ensure the link is publicly accessible.",
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
                message="Could not process video link. Please verify the URL and try again.",
                detail=err_msg[:200] if err_msg else "No details returned by extractor",
                retryable=True
            )

ytdlp_service = YtDlpService()
