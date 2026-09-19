import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request
from backend.app.core.exceptions import RateLimitException

class SlidingWindowRateLimiter:
    """Sliding window rate limiter per client IP."""
    def __init__(self):
        # IP -> list of timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, ip: str, max_requests: int, window_seconds: int = 60):
        now = time.time()
        window_start = now - window_seconds
        
        # Clean older timestamps
        self.requests[ip] = [ts for ts in self.requests[ip] if ts > window_start]
        
        if len(self.requests[ip]) >= max_requests:
            oldest = self.requests[ip][0]
            retry_after = max(1, int(oldest + window_seconds - now))
            raise RateLimitException(retry_after=retry_after)
            
        self.requests[ip].append(now)

rate_limiter = SlidingWindowRateLimiter()

def get_client_ip(request: Request) -> str:
    """Retrieves real client IP address handling standard proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"
