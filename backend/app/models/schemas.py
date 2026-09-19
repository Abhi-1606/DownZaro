from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class URLParseRequest(BaseModel):
    url: str = Field(..., description="Raw media URL or pasted text containing a link", max_length=4096)

class URLParseResponse(BaseModel):
    original_input: str
    canonical_url: str
    platform_id: str
    platform_name: str
    icon: str
    is_short: bool
    is_direct_file: bool
    start_seconds: int
    had_multiple_urls: bool

class HealthResponse(BaseModel):
    status: str
    ytdlp_installed: bool
    ytdlp_version: Optional[str]
    ffmpeg_installed: bool
    ffmpeg_version: Optional[str]
    max_duration_seconds: int
    max_file_size_mb: int
    temp_dir: str
