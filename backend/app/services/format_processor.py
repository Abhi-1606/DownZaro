from typing import Dict, Any, List, Optional
import math

def format_duration(seconds: Optional[float]) -> str:
    """Formats duration seconds to HH:MM:SS or MM:SS."""
    if not seconds or math.isnan(seconds):
        return "Unknown duration"
    total_sec = int(seconds)
    hours = total_sec // 3600
    minutes = (total_sec % 3600) // 60
    sec = total_sec % 60
    if hours > 0:
        return f"{hours}:{minutes:02d}:{sec:02d}"
    return f"{minutes}:{sec:02d}"

def estimate_format_size(fmt: Dict[str, Any], duration_sec: Optional[float]) -> int:
    """Returns exact filesize or estimates from tbr/vbr/abr and duration."""
    if fmt.get("filesize") and fmt["filesize"] > 0:
        return fmt["filesize"]
    if fmt.get("filesize_approx") and fmt["filesize_approx"] > 0:
        return fmt["filesize_approx"]
    
    tbr = fmt.get("tbr") or ((fmt.get("vbr") or 0) + (fmt.get("abr") or 0))
    if tbr and duration_sec and duration_sec > 0:
        return int((tbr * 1000 / 8) * duration_sec)
    return 0

def process_media_formats(raw_info: Dict[str, Any]) -> Dict[str, Any]:
    """Processes raw yt-dlp metadata into cleanly grouped formats, embed URL, and preview streams."""
    duration = raw_info.get("duration") or 0
    raw_formats = raw_info.get("formats") or []
    video_id = str(raw_info.get("id") or "media")
    extractor_key = str(raw_info.get("extractor_key") or raw_info.get("extractor") or "generic").lower()
    
    has_audio = any(f.get("acodec") != "none" or f.get("audio_channels") for f in raw_formats)
    
    video_options: List[Dict[str, Any]] = []
    seen_resolutions = set()
    best_preview_url: Optional[str] = None
    embed_url: Optional[str] = None

    # Determine official embed URL based on platform for 100% playable in-app preview
    webpage_url = str(raw_info.get("webpage_url") or "").lower()
    if "youtube" in extractor_key or "youtu" in extractor_key or "youtube.com" in webpage_url or "youtu.be" in webpage_url:
        embed_url = f"https://www.youtube-nocookie.com/embed/{video_id}?rel=0&modestbranding=1&playsinline=1"
    elif "vimeo" in extractor_key or "vimeo.com" in webpage_url:
        embed_url = f"https://player.vimeo.com/video/{video_id}"
    elif "dailymotion" in extractor_key or "dailymotion.com" in webpage_url:
        embed_url = f"https://www.dailymotion.com/embed/video/{video_id}"
    elif "twitch" in extractor_key:
        embed_url = f"https://clips.twitch.tv/embed?clip={video_id}&parent=localhost"
    elif "tiktok" in extractor_key or "tiktok.com" in webpage_url:
        embed_url = f"https://www.tiktok.com/embed/v2/{video_id}"

    # Sort formats by resolution & quality descending
    sorted_formats = sorted(
        raw_formats,
        key=lambda f: (
            f.get("height") or 0,
            f.get("fps") or 0,
            f.get("tbr") or 0
        ),
        reverse=True
    )

    # Find playable direct stream URL for HTML5 player
    for f in sorted_formats:
        vcodec = f.get("vcodec") or ""
        acodec = f.get("acodec") or ""
        url = f.get("url") or ""
        if vcodec != "none" and url:
            if acodec != "none" and ("avc" in vcodec.lower() or "h264" in vcodec.lower() or f.get("ext") == "mp4"):
                best_preview_url = url
                break
            elif not best_preview_url:
                best_preview_url = url

    if not best_preview_url and raw_info.get("url"):
        best_preview_url = raw_info.get("url")

    # Process Video Download Options
    recommended_set = False
    for f in sorted_formats:
        height = f.get("height")
        if not height or height < 144:
            continue

        res_label = f"{height}p"
        fps = f.get("fps") or 30
        ext = f.get("ext") or "mp4"
        vcodec = f.get("vcodec") or "unknown"
        hdr = "HDR" if f.get("dynamic_range") in ("HDR", "HDR10", "DV") or "hdr" in vcodec.lower() else None

        key = (height, fps >= 50, ext == "mp4")
        if key in seen_resolutions:
            continue
        seen_resolutions.add(key)

        est_bytes = estimate_format_size(f, duration)
        
        is_rec = False
        if not recommended_set and height <= 1080 and ("avc" in vcodec.lower() or "h264" in vcodec.lower() or ext == "mp4"):
            is_rec = True
            recommended_set = True

        video_options.append({
            "format_id": str(f.get("format_id")),
            "resolution": res_label,
            "height": height,
            "width": f.get("width"),
            "fps": fps,
            "ext": "mp4",
            "codec": vcodec.split(".")[0] if vcodec else "H.264",
            "hdr": hdr,
            "size_bytes": est_bytes,
            "is_recommended": is_rec,
            "requires_merge": f.get("acodec") == "none",
        })

    if not recommended_set and video_options:
        video_options[0]["is_recommended"] = True

    # Process Audio Options
    audio_options: List[Dict[str, Any]] = []
    if has_audio:
        audio_options = [
            {
                "audio_id": "mp3-320k",
                "title": "MP3 High Quality",
                "bitrate": "320 kbps",
                "ext": "mp3",
                "badge": "Best Quality",
                "is_recommended": True,
                "size_bytes": int((320 * 1000 / 8) * duration) if duration else 0,
            },
            {
                "audio_id": "mp3-192k",
                "title": "MP3 Standard",
                "bitrate": "192 kbps",
                "ext": "mp3",
                "badge": "Standard",
                "is_recommended": False,
                "size_bytes": int((192 * 1000 / 8) * duration) if duration else 0,
            },
            {
                "audio_id": "mp3-128k",
                "title": "MP3 Compact",
                "bitrate": "128 kbps",
                "ext": "mp3",
                "badge": "Small Size",
                "is_recommended": False,
                "size_bytes": int((128 * 1000 / 8) * duration) if duration else 0,
            },
            {
                "audio_id": "m4a-original",
                "title": "M4A Original (AAC)",
                "bitrate": "Original",
                "ext": "m4a",
                "badge": "Apple / iTunes",
                "is_recommended": False,
                "size_bytes": int((160 * 1000 / 8) * duration) if duration else 0,
            },
        ]

    # Process Thumbnails
    thumbnail_options: List[Dict[str, Any]] = []
    raw_thumbs = raw_info.get("thumbnails") or []
    if raw_thumbs:
        sorted_thumbs = sorted(
            raw_thumbs,
            key=lambda t: (t.get("preference") or 0, t.get("width") or 0, t.get("height") or 0),
            reverse=True
        )
        for i, t in enumerate(sorted_thumbs[:4]):
            w = t.get("width")
            h = t.get("height")
            res_label = f"{w}x{h}" if w and h else ("High Resolution" if i == 0 else f"Resolution {i+1}")
            thumbnail_options.append({
                "thumb_id": f"thumb-{i}",
                "resolution": res_label,
                "width": w,
                "height": h,
                "url": t.get("url"),
                "ext": "jpg",
                "is_recommended": (i == 0),
            })
    elif raw_info.get("thumbnail"):
        thumbnail_options.append({
            "thumb_id": "thumb-0",
            "resolution": "Original HD",
            "url": raw_info.get("thumbnail"),
            "ext": "jpg",
            "is_recommended": True,
        })

    return {
        "video_id": video_id,
        "extractor_key": extractor_key,
        "title": raw_info.get("title") or "Media Download",
        "uploader": raw_info.get("uploader") or raw_info.get("channel") or raw_info.get("creator") or "Unknown Creator",
        "uploader_url": raw_info.get("uploader_url") or raw_info.get("channel_url"),
        "duration": duration,
        "duration_formatted": format_duration(duration),
        "view_count": raw_info.get("view_count"),
        "like_count": raw_info.get("like_count"),
        "upload_date": raw_info.get("upload_date"),
        "description": raw_info.get("description") or "",
        "thumbnail": raw_info.get("thumbnail") or (thumbnail_options[0]["url"] if thumbnail_options else None),
        "preview_stream_url": best_preview_url,
        "embed_url": embed_url,
        "has_audio": has_audio,
        "video_formats": video_options,
        "audio_formats": audio_options,
        "thumbnails": thumbnail_options,
        "webpage_url": raw_info.get("webpage_url"),
    }
