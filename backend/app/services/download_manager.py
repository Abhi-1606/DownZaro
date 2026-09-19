import os
import re
import uuid
import time
import signal
import shutil
import asyncio
import logging
import zipfile
import certifi
from typing import Dict, Any, Optional, List
from collections import defaultdict

from backend.app.config import settings
from backend.app.core.exceptions import DownZaroException, MediaNotFoundException
from backend.app.core.security import sanitize_filename, sanitize_format_id
from backend.app.services.system_checker import get_ffmpeg_binary_path, setup_ffmpeg_symlinks

logger = logging.getLogger("downzaro.download_manager")

JOBS: Dict[str, Dict[str, Any]] = {}
PROGRESS_LISTENERS: Dict[str, List[asyncio.Queue]] = defaultdict(list)
CLIENT_ACTIVE_JOBS: Dict[str, set] = defaultdict(set)
GLOBAL_SEMAPHORE = asyncio.Semaphore(settings.MAX_CONCURRENT_JOBS_GLOBAL)

PROGRESS_REGEX = re.compile(
    r'\[download\]\s+(?P<percent>\d+(?:\.\d+)?)%\s+of\s+(?P<total>~?\s*[\d.]+\s*[KMGTP]?i?B|Unknown)\s+at\s+(?P<speed>[\d.]+\s*[KMGTP]?i?B/s|Unknown)\s+ETA\s+(?P<eta>[\d:]+|Unknown)',
    re.IGNORECASE
)

class DownloadManager:
    def __init__(self):
        self.ytdlp_bin = shutil.which("yt-dlp") or shutil.which("yt_dlp") or "yt-dlp"
        self.ffmpeg_dir = setup_ffmpeg_symlinks()
        self.ffmpeg_bin = get_ffmpeg_binary_path()
        self.temp_dir = settings.TEMP_DIR
        os.makedirs(self.temp_dir, exist_ok=True)

    def create_job(
        self,
        client_ip: str,
        canonical_url: str,
        title: str,
        video_id: str,
        extractor_key: str,
        format_type: str,
        format_id: Optional[str] = None,
        audio_id: Optional[str] = None,
        thumb_id: Optional[str] = None,
        thumbnail_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Registers a new job and queues it for execution."""
        active_for_client = [
            j_id for j_id in CLIENT_ACTIVE_JOBS[client_ip]
            if JOBS.get(j_id, {}).get("status") in ("queued", "preparing", "downloading_video", "downloading_audio", "merging")
        ]
        if len(active_for_client) >= settings.MAX_CONCURRENT_JOBS_PER_CLIENT:
            raise DownZaroException(
                status_code=429,
                code="CONCURRENCY_LIMIT",
                message=f"You have {len(active_for_client)} active downloads in progress. Please wait for them to complete.",
                retryable=True
            )

        job_id = str(uuid.uuid4())
        job_dir = os.path.join(self.temp_dir, job_id)
        os.makedirs(job_dir, exist_ok=True)

        job = {
            "job_id": job_id,
            "client_ip": client_ip,
            "url": canonical_url,
            "title": title,
            "video_id": video_id,
            "extractor_key": extractor_key,
            "format_type": format_type,
            "format_id": sanitize_format_id(format_id or ""),
            "audio_id": audio_id,
            "thumb_id": thumb_id,
            "thumbnail_url": thumbnail_url,
            "status": "queued",
            "stage_label": "Queued in download manager",
            "progress_percent": 0.0,
            "speed_str": "--",
            "eta_str": "--",
            "downloaded_bytes": 0,
            "total_bytes": 0,
            "job_dir": job_dir,
            "output_file_path": None,
            "filename": None,
            "error_message": None,
            "created_at": time.time(),
            "updated_at": time.time(),
            "proc": None,
            "task": None,
            "can_resume": True,
        }

        JOBS[job_id] = job
        CLIENT_ACTIVE_JOBS[client_ip].add(job_id)
        job["task"] = asyncio.create_task(self._run_job_lifecycle(job_id))
        return job

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return JOBS.get(job_id)

    async def broadcast_progress(self, job_id: str):
        job = JOBS.get(job_id)
        if not job:
            return
        
        job["updated_at"] = time.time()
        payload = {
            "job_id": job["job_id"],
            "status": job["status"],
            "stage_label": job["stage_label"],
            "progress_percent": round(job["progress_percent"], 1),
            "speed": job["speed_str"],
            "eta": job["eta_str"],
            "filename": job["filename"],
            "error": job["error_message"],
            "download_url": f"/api/file/{job_id}" if job["status"] == "ready" else None,
        }

        listeners = PROGRESS_LISTENERS.get(job_id, [])
        for queue in list(listeners):
            try:
                await queue.put(payload)
            except Exception:
                pass

    async def cancel_job(self, job_id: str):
        job = JOBS.get(job_id)
        if not job:
            return

        job["status"] = "cancelled"
        job["stage_label"] = "Cancelled by user"
        
        proc = job.get("proc")
        if proc:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass

        job_dir = job.get("job_dir")
        if job_dir and os.path.exists(job_dir):
            try:
                shutil.rmtree(job_dir, ignore_errors=True)
            except Exception:
                pass

        await self.broadcast_progress(job_id)

    async def _run_job_lifecycle(self, job_id: str):
        job = JOBS.get(job_id)
        if not job:
            return

        async with GLOBAL_SEMAPHORE:
            try:
                job["status"] = "preparing"
                job["stage_label"] = "Preparing download..."
                await self.broadcast_progress(job_id)

                if job["format_type"] == "thumbnail":
                    await self._download_thumbnail(job)
                elif job["format_type"] == "audio":
                    await self._download_audio(job)
                elif job["format_type"] == "all_in_one":
                    await self._download_all_in_one(job)
                else:
                    await self._download_video(job)

                job["status"] = "ready"
                job["stage_label"] = "Download ready!"
                job["progress_percent"] = 100.0
                await self.broadcast_progress(job_id)

            except Exception as e:
                logger.error(f"Job {job_id} failed: {e}", exc_info=True)
                if job["status"] != "cancelled":
                    job["status"] = "failed"
                    clean_err = str(e)
                    if hasattr(e, 'detail') and isinstance(e.detail, dict):
                        clean_err = e.detail.get('message') or clean_err
                    elif hasattr(e, 'detail'):
                        clean_err = str(e.detail)
                    job["error_message"] = clean_err
                    job["stage_label"] = "Download failed"
                    await self.broadcast_progress(job_id)

    async def _download_video(self, job: Dict[str, Any]):
        job_dir = job["job_dir"]
        safe_title = sanitize_filename(job["title"], max_length=90)
        output_template = os.path.join(job_dir, f"{safe_title}.%(ext)s")

        format_id = job.get("format_id")
        if format_id:
            format_spec = f"{format_id}+bestaudio/best"
        else:
            format_spec = "bestvideo+bestaudio/best"

        args = [
            self.ytdlp_bin,
            "--ffmpeg-location", self.ffmpeg_dir,
            "--format", format_spec,
            "--merge-output-format", "mp4",
            "--no-playlist",
            "--continue",
            "--newline",
            "--no-check-certificates",
            "--output", output_template,
            "--no-warnings",
            "--socket-timeout", "30",
        ]

        node_bin = shutil.which("node")
        if node_bin:
            args.extend(["--js-runtimes", f"node:{node_bin}"])

        if settings.COOKIES_FILE_PATH and os.path.exists(settings.COOKIES_FILE_PATH):
            args.extend(["--cookies", settings.COOKIES_FILE_PATH])

        args.extend(["--", job["url"]])
        await self._execute_subprocess_with_progress(job, args)
        self._find_and_assign_output_file(job)

    async def _download_audio(self, job: Dict[str, Any]):
        job_dir = job["job_dir"]
        safe_title = sanitize_filename(job["title"], max_length=90)
        output_template = os.path.join(job_dir, f"{safe_title}.%(ext)s")
        audio_id = job.get("audio_id") or "mp3-320k"

        args = [
            self.ytdlp_bin,
            "--ffmpeg-location", self.ffmpeg_dir,
            "--extract-audio",
            "--no-playlist",
            "--continue",
            "--newline",
            "--no-check-certificates",
            "--output", output_template,
            "--no-warnings",
            "--socket-timeout", "30",
        ]

        if "m4a" in audio_id:
            args.extend(["--audio-format", "m4a"])
        else:
            args.extend(["--audio-format", "mp3"])
            if "320" in audio_id:
                args.extend(["--audio-quality", "320K"])
            elif "192" in audio_id:
                args.extend(["--audio-quality", "192K"])
            else:
                args.extend(["--audio-quality", "128K"])

        node_bin = shutil.which("node")
        if node_bin:
            args.extend(["--js-runtimes", f"node:{node_bin}"])

        if settings.COOKIES_FILE_PATH and os.path.exists(settings.COOKIES_FILE_PATH):
            args.extend(["--cookies", settings.COOKIES_FILE_PATH])

        args.extend(["--", job["url"]])
        await self._execute_subprocess_with_progress(job, args)
        self._find_and_assign_output_file(job)

    async def _download_thumbnail(self, job: Dict[str, Any]):
        job_dir = job["job_dir"]
        safe_title = sanitize_filename(job["title"], max_length=90)
        output_file = os.path.join(job_dir, f"{safe_title}-thumb.jpg")

        thumb_url = job.get("thumbnail_url")
        if not thumb_url:
            raise MediaNotFoundException("No thumbnail URL found for this media.")

        import httpx
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, verify=False) as client:
            resp = await client.get(thumb_url)
            if resp.status_code == 200:
                with open(output_file, "wb") as f:
                    f.write(resp.content)
            else:
                raise DownZaroException(status_code=502, code="THUMB_FETCH_FAILED", message="Failed to fetch thumbnail image.")

        job["output_file_path"] = output_file
        job["filename"] = f"{safe_title}-thumb.jpg"

    async def _download_all_in_one(self, job: Dict[str, Any]):
        job["stage_label"] = "Downloading Video bundle..."
        await self._download_video(job)
        video_file = job["output_file_path"]

        job["stage_label"] = "Extracting Audio (MP3)..."
        await self._download_audio(job)
        audio_file = job["output_file_path"]

        if job.get("thumbnail_url"):
            job["stage_label"] = "Saving Thumbnail..."
            await self._download_thumbnail(job)
            thumb_file = job["output_file_path"]
        else:
            thumb_file = None

        job["stage_label"] = "Bundling All in One ZIP..."
        safe_title = sanitize_filename(job["title"], max_length=90)
        zip_filename = f"{safe_title} - DownZaro Bundle.zip"
        zip_path = os.path.join(job["job_dir"], zip_filename)

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            if video_file and os.path.exists(video_file):
                zf.write(video_file, os.path.basename(video_file))
            if audio_file and os.path.exists(audio_file):
                zf.write(audio_file, os.path.basename(audio_file))
            if thumb_file and os.path.exists(thumb_file):
                zf.write(thumb_file, os.path.basename(thumb_file))

        job["output_file_path"] = zip_path
        job["filename"] = zip_filename

    async def _execute_subprocess_with_progress(self, job: Dict[str, Any], args: List[str]):
        custom_env = os.environ.copy()
        custom_env["PATH"] = f"{self.ffmpeg_dir}:{custom_env.get('PATH', '')}"
        
        # Point OpenSSL / requests to certifi CA bundle on macOS
        ca_path = certifi.where()
        custom_env["SSL_CERT_FILE"] = ca_path
        custom_env["REQUESTS_CA_BUNDLE"] = ca_path
        custom_env["CURL_CA_BUNDLE"] = ca_path

        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=custom_env,
            preexec_fn=os.setsid
        )
        job["proc"] = proc

        last_broadcast = 0.0
        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            line_str = line.decode("utf-8", errors="ignore").strip()

            match = PROGRESS_REGEX.search(line_str)
            if match:
                job["status"] = "downloading_video" if job["format_type"] == "video" else "downloading_audio"
                job["progress_percent"] = float(match.group("percent"))
                job["speed_str"] = match.group("speed").strip()
                job["eta_str"] = match.group("eta").strip()
                job["stage_label"] = f"Downloading ({job['progress_percent']}%)"

                now = time.time()
                if now - last_broadcast > 0.25:
                    last_broadcast = now
                    await self.broadcast_progress(job["job_id"])
            elif "[Merger]" in line_str or "Merging formats" in line_str:
                job["status"] = "merging"
                job["stage_label"] = "Merging audio and video (ffmpeg)..."
                await self.broadcast_progress(job["job_id"])
            elif "[ExtractAudio]" in line_str or "Destination:" in line_str:
                job["stage_label"] = "Converting audio format..."
                await self.broadcast_progress(job["job_id"])

        stderr_output = await proc.stderr.read()
        await proc.wait()

        if proc.returncode != 0 and job["status"] != "cancelled":
            err_text = stderr_output.decode("utf-8", errors="ignore")
            logger.error(f"Download subprocess exited with {proc.returncode}: {err_text}")
            raise DownZaroException(
                status_code=502,
                code="DOWNLOAD_SUBPROCESS_FAILED",
                message="Failed to complete media download. The format or server connection was interrupted."
            )

    def _find_and_assign_output_file(self, job: Dict[str, Any]):
        job_dir = job["job_dir"]
        files = [f for f in os.listdir(job_dir) if not f.endswith((".part", ".ytdl", ".temp"))]
        if not files:
            raise DownZaroException(status_code=500, code="FILE_MISSING", message="Output file was not generated.")

        full_paths = [os.path.join(job_dir, f) for f in files]
        full_paths.sort(key=lambda p: os.path.getmtime(p), reverse=True)
        chosen = full_paths[0]

        if os.path.getsize(chosen) == 0:
            raise DownZaroException(status_code=500, code="EMPTY_FILE", message="Downloaded file is empty (0 bytes).")

        job["output_file_path"] = chosen
        job["filename"] = os.path.basename(chosen)

download_manager = DownloadManager()
