import os
import shutil
import subprocess
import logging
from typing import Optional
import imageio_ffmpeg

logger = logging.getLogger("downzaro.system")

def setup_ffmpeg_symlinks() -> str:
    """
    Ensures ffmpeg and ffprobe are available in a predictable directory.
    Creates symlinks in backend/venv/bin or /tmp/bin if not already present.
    """
    venv_bin = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "venv", "bin"))
    try:
        os.makedirs(venv_bin, exist_ok=True)
    except Exception:
        venv_bin = "/tmp/bin"
        try:
            os.makedirs(venv_bin, exist_ok=True)
        except Exception:
            pass
    
    ffmpeg_target = os.path.join(venv_bin, "ffmpeg")
    ffprobe_target = os.path.join(venv_bin, "ffprobe")
    
    bundled = None
    try:
        bundled = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:
        logger.warning(f"Could not load bundled ffmpeg: {e}")

    system_ffmpeg = shutil.which("ffmpeg") or bundled

    if system_ffmpeg and not os.path.exists(ffmpeg_target):
        try:
            os.symlink(system_ffmpeg, ffmpeg_target)
            logger.info(f"Created ffmpeg symlink at {ffmpeg_target} -> {system_ffmpeg}")
        except Exception as e:
            logger.warning(f"Failed to symlink ffmpeg: {e}")

    # Remove invalid ffprobe symlinks that point to ffmpeg (breaks yt-dlp audio postprocessing)
    if os.path.exists(ffprobe_target):
        try:
            target_dest = os.path.realpath(ffprobe_target)
            if "ffmpeg" in os.path.basename(target_dest).lower():
                os.remove(ffprobe_target)
                logger.info(f"Removed invalid ffprobe symlink pointing to ffmpeg binary")
        except Exception as e:
            logger.warning(f"Could not clean ffprobe symlink: {e}")

    # Only symlink ffprobe if a genuine ffprobe binary is found on system
    system_ffprobe = shutil.which("ffprobe")
    if system_ffprobe and os.path.realpath(system_ffprobe) != os.path.realpath(system_ffmpeg or ""):
        if not os.path.exists(ffprobe_target):
            try:
                os.symlink(system_ffprobe, ffprobe_target)
                logger.info(f"Created ffprobe symlink at {ffprobe_target} -> {system_ffprobe}")
            except Exception as e:
                logger.warning(f"Failed to symlink ffprobe: {e}")

    return venv_bin

def get_ffmpeg_binary_path() -> Optional[str]:
    """Finds ffmpeg from venv bin, system PATH or imageio_ffmpeg bundled binary."""
    venv_dir = setup_ffmpeg_symlinks()
    venv_ffmpeg = os.path.join(venv_dir, "ffmpeg")
    if os.path.isfile(venv_ffmpeg) and os.access(venv_ffmpeg, os.X_OK):
        return venv_ffmpeg
        
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
        
    try:
        bundled = imageio_ffmpeg.get_ffmpeg_exe()
        if bundled and os.path.isfile(bundled) and os.access(bundled, os.X_OK):
            return bundled
    except Exception as e:
        logger.warning(f"Could not load bundled ffmpeg: {e}")
    return None

def verify_system_dependencies() -> dict:
    """
    Checks that yt-dlp and ffmpeg/ffprobe exist and are executable.
    Logs versions on startup. Returns a diagnostic dictionary.
    """
    ytdlp_path = shutil.which("yt-dlp") or shutil.which("yt_dlp")
    ffmpeg_path = get_ffmpeg_binary_path()

    diagnostics = {
        "ytdlp_installed": False,
        "ytdlp_version": None,
        "ytdlp_path": ytdlp_path,
        "ffmpeg_installed": False,
        "ffmpeg_version": None,
        "ffmpeg_path": ffmpeg_path,
    }

    # Verify yt-dlp
    try:
        cmd = [ytdlp_path or "yt-dlp", "--version"]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            diagnostics["ytdlp_installed"] = True
            diagnostics["ytdlp_version"] = res.stdout.strip()
            logger.info(f"✓ yt-dlp verified: version {diagnostics['ytdlp_version']} ({ytdlp_path})")
    except Exception as e:
        logger.error(f"✗ Failed to execute yt-dlp: {e}")

    # Verify ffmpeg
    if ffmpeg_path:
        try:
            res = subprocess.run([ffmpeg_path, "-version"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                first_line = res.stdout.splitlines()[0] if res.stdout else "Unknown version"
                diagnostics["ffmpeg_installed"] = True
                diagnostics["ffmpeg_version"] = first_line
                logger.info(f"✓ ffmpeg verified: {first_line} ({ffmpeg_path})")
        except Exception as e:
            logger.error(f"✗ Failed to execute ffmpeg at {ffmpeg_path}: {e}")
    else:
        logger.warning("✗ ffmpeg binary could not be found.")

    return diagnostics
