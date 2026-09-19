import json
import asyncio
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from backend.app.services.download_manager import download_manager, PROGRESS_LISTENERS, JOBS
from backend.app.core.exceptions import DownZaroException

router = APIRouter(tags=["Progress SSE"])

@router.get("/api/progress/{job_id}")
async def stream_job_progress(job_id: str, request: Request):
    job = download_manager.get_job(job_id)
    if not job:
        raise DownZaroException(status_code=404, code="JOB_NOT_FOUND", message="Job not found.")

    queue: asyncio.Queue = asyncio.Queue()
    PROGRESS_LISTENERS[job_id].append(queue)

    async def event_generator():
        # Send initial immediate state
        current_job = JOBS.get(job_id)
        if current_job:
            init_payload = {
                "job_id": current_job["job_id"],
                "status": current_job["status"],
                "stage_label": current_job["stage_label"],
                "progress_percent": round(current_job["progress_percent"], 1),
                "speed": current_job["speed_str"],
                "eta": current_job["eta_str"],
                "filename": current_job["filename"],
                "error": current_job["error_message"],
                "download_url": f"/api/file/{job_id}" if current_job["status"] == "ready" else None,
            }
            yield {
                "event": "progress",
                "data": json.dumps(init_payload)
            }

        try:
            while True:
                # Disconnect check
                if await request.is_disconnected():
                    break
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {
                        "event": "progress",
                        "data": json.dumps(payload)
                    }
                    if payload.get("status") in ("ready", "failed", "cancelled"):
                        break
                except asyncio.TimeoutError:
                    # Send heartbeat ping to keep connection alive
                    yield {
                        "event": "ping",
                        "data": json.dumps({"ping": True})
                    }
        finally:
            if queue in PROGRESS_LISTENERS.get(job_id, []):
                PROGRESS_LISTENERS[job_id].remove(queue)

    return EventSourceResponse(event_generator())
