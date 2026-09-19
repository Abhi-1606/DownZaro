from typing import Optional, Any, Dict
from fastapi import HTTPException, status

class DownZaroException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        detail: Optional[str] = None,
        retryable: bool = False,
        extra: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "code": code,
                "message": message,
                "detail": detail or message,
                "retryable": retryable,
                **(extra or {})
            }
        )

class InvalidURLException(DownZaroException):
    def __init__(self, message: str = "Please provide a valid, supported media URL."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_URL",
            message=message,
            retryable=False
        )

class SSRFBlockedException(DownZaroException):
    def __init__(self, message: str = "Access to local or private network addresses is forbidden."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="SSRF_BLOCKED",
            message=message,
            retryable=False
        )

class UnsupportedPlatformException(DownZaroException):
    def __init__(self, message: str = "This platform or URL format is not supported."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="UNSUPPORTED_PLATFORM",
            message=message,
            retryable=False
        )

class PlaylistNotAllowedException(DownZaroException):
    def __init__(self, message: str = "This is a playlist/channel link. Paste a single video link."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="PLAYLIST_LINK",
            message=message,
            retryable=False
        )

class MediaNotFoundException(DownZaroException):
    def __init__(self, message: str = "No downloadable video or media found at this link."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="MEDIA_NOT_FOUND",
            message=message,
            retryable=False
        )

class DRMProtectedException(DownZaroException):
    def __init__(self, message: str = "This content is DRM-protected and cannot be downloaded."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="DRM_PROTECTED",
            message=message,
            retryable=False
        )

class LiveStreamException(DownZaroException):
    def __init__(self, message: str = "Live stream in progress. Live recording is not supported."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="LIVE_STREAM",
            message=message,
            retryable=False
        )

class RateLimitException(DownZaroException):
    def __init__(self, retry_after: int = 60, message: str = "Too many requests. Please wait before trying again."):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code="RATE_LIMITED",
            message=message,
            retryable=True,
            extra={"retry_after": retry_after}
        )
