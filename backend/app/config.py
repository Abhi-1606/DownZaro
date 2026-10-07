import os
import shutil
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    MAX_CONCURRENT_JOBS_PER_CLIENT: int = 2
    MAX_CONCURRENT_JOBS_GLOBAL: int = 10
    MAX_DOWNLOAD_FILE_SIZE_MB: int = 10240  # 10 GB for 4K/60fps media
    MAX_DURATION_SECONDS: int = 14400  # 4 hours
    TEMP_DIR: str = "/tmp/downzaro_downloads"
    TEMP_FILE_TTL_SECONDS: int = 1800  # 30 minutes
    CLEANUP_INTERVAL_SECONDS: int = 300  # 5 minutes

    RATE_LIMIT_INFO_PER_MINUTE: int = 60
    RATE_LIMIT_DOWNLOAD_PER_MINUTE: int = 20
    RATE_LIMIT_STREAM_PER_MINUTE: int = 120

    COOKIES_FILE_PATH: str = ""
    COOKIES_CONTENT: str = ""
    YOUTUBE_COOKIES: str = ""
    PROXY_URL: str = ""
    YTDLP_AUTO_UPDATE: bool = False

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()

# Ensure temp directory exists
os.makedirs(settings.TEMP_DIR, exist_ok=True)

# Auto-initialize cookies from environment variable if provided
cookie_raw = settings.COOKIES_CONTENT or settings.YOUTUBE_COOKIES
if cookie_raw and not settings.COOKIES_FILE_PATH:
    try:
        cookie_path = os.path.join(settings.TEMP_DIR, "youtube_cookies.txt")
        with open(cookie_path, "w", encoding="utf-8") as f:
            f.write(cookie_raw)
        settings.COOKIES_FILE_PATH = cookie_path
    except Exception as e:
        pass
