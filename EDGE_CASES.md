# DownZaro - Running Edge Cases & Handling Log

This document records all edge cases discovered and addressed across DownZaro's frontend, backend, security, media extraction, and playback pipelines.

---

## 1. URL Input, Validation & Normalization

| # | Edge Case | Discovered Scenario | Resolution / Implementation |
|---|---|---|---|
| 1.1 | **Whitespace & Zero-Width Characters** | URLs copied from messaging apps (e.g. WhatsApp, Telegram) with `\u200B`, `\u200C`, `\uFEFF`, leading/trailing spaces or tabs. | `sanitize_and_extract_url()` strips zero-width chars, whitespace, and control characters before parsing. |
| 1.2 | **Pasted Text Containing a URL** | User pastes "Check out this reel: https://www.instagram.com/reel/..." | Regex extracts the first valid HTTP/HTTPS URL from arbitrary surround text. |
| 1.3 | **Multiple URLs Pasted** | User pastes several lines or links at once. | Extracts the first valid link and normalizes it, returning a notice if multiple were found. |
| 1.4 | **Missing Protocol** | User enters `youtube.com/watch?v=dQw4w9WgXcQ` or `tiktok.com/@user/video/...` without `https://`. | Automatically prepends `https://` if no scheme is present. |
| 1.5 | **Dangerous / Non-HTTP Schemes** | User passes `javascript:`, `data:`, `file:`, `ftp:`, `blob:`, `about:`. | Strict whitelist of allowed schemes: only `http` and `https` accepted. All others rejected with 400. |
| 1.6 | **Excessive URL Length / ReDoS** | Maliciously long URLs (>2048 characters). | Length check enforces hard limit of 2048 characters before regex execution. |
| 1.7 | **Internationalized Domain Names (IDN)** | Unicode / Cyrillic / Arabic / CJK domain names (e.g. `https://xn--...`). | Standardized to Punycode via `idna.encode()` for DNS resolution and canonical URL mapping. |
| 1.8 | **Mobile & Alternate Hostnames** | `m.youtube.com`, `music.youtube.com`, `youtu.be`, `youtube.com/shorts`, `vm.tiktok.com`, `x.com` vs `twitter.com`, `fb.watch`. | Hostname & path mapping normalizes to canonical host patterns while preserving video identifiers. |
| 1.9 | **Tracking & Analytics Parameters** | Query strings polluted with `utm_*`, `si`, `fbclid`, `igshid`, `gclid`, `ref_src`, `source`, `feature=share`. | Stripped from the canonical URL so cache lookups match identical content regardless of share source. |
| 1.10 | **Playback Timestamps in URLs** | URLs with `?t=120`, `&t=1m30s`, `?start=90`. | Extracted and saved to metadata as `start_time_seconds` for initial player seek, while maintaining full video download. |
| 1.11 | **Playlists Attached to Single Video Watch URLs** | YouTube watch URLs with `&list=RD...` or `&index=1`. | Single video ID is isolated and `list` query param stripped for canonical extraction with `--no-playlist`. |
| 1.12 | **Pure Channel / Profile / Playlist Links** | User pastes `/playlist?list=...`, `/channel/...`, `/@creator`, `/user/...`. | Pattern detector flags playlist/channel links with an explicit actionable message: "This is a playlist/channel link. Paste a single video link." |
| 1.13 | **Shortened URLs (Redirect Chains)** | Shorteners like `bit.ly`, `t.co`, `tinyurl.com`, `is.gd`. | Async HTTP HEAD/GET resolver follows redirects with strict cap (max 5 hops) and 5s timeout, re-verifying SSRF protection on every hop. |

---

## 2. Security & SSRF Protection

| # | Edge Case | Discovered Scenario | Resolution / Implementation |
|---|---|---|---|
| 2.1 | **Private & Loopback IP Access** | URL resolves to `127.0.0.1`, `localhost`, `0.0.0.0`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. | `validate_url_ssrf()` resolves DNS before connecting and rejects any RFC 1918 / loopback / link-local / broadcast IP. |
| 2.2 | **Cloud Metadata Endpoints** | Attackers targeting AWS/GCP metadata (`http://169.254.169.254/...`). | Link-local range `169.254.0.0/16` and IPv6 `fe80::/10` explicitly blocked. |
| 2.3 | **IPv6 Loopback & Transition Addresses** | `::1`, `::ffff:127.0.0.1`, `64:ff9b::...` (IPv4-mapped). | Full IPv6 validation with `ipaddress.ip_address()` checking `is_private`, `is_loopback`, `is_link_local`, `is_reserved`. |
| 2.4 | **DNS Rebinding Attacks** | Host resolves to public IP on first check, but resolves to private IP during fetch. | HTTP client uses pinned IP transport or custom DNS resolver verifying resolved IP at socket connect time. |
| 2.5 | **Command Injection via Subprocess** | Special characters in URLs (e.g. `https://example.com/video; rm -rf /` or flags `--exec`). | Subprocess arguments always passed as separate list elements with leading `"--"` delimiter (`["yt-dlp", ..., "--", url]`). Never executed in shell (`shell=False`). |
| 2.6 | **Format ID Injection** | Client supplies malicious `format_id` strings (e.g. `best; rm -rf`). | Format ID is strictly validated against the allowlist of format IDs returned by the server's own metadata extraction for that specific job. |
| 2.7 | **Path Traversal in Temp Storage** | Filenames containing `../`, `/etc/passwd`, Windows drive letters. | Jobs are assigned random UUIDv4 identifiers. Files are stored and retrieved strictly by `job_id` inside isolated temp subdirectories. |

---

## 3. Platform Detection & Media Metadata

| # | Edge Case | Discovered Scenario | Resolution / Implementation |
|---|---|---|---|
| 3.1 | **Live Streams Airing Live** | `is_live=True` or duration is None/infinite. | Detected and blocked from unlimited recording: returns actionable message "Live stream in progress. Please wait until the stream has concluded." |
| 3.2 | **Upcoming Premieres** | Video is scheduled but has not started yet (`live_status == 'is_upcoming'`). | Returns "This video is an upcoming premiere and hasn't aired yet." |
| 3.3 | **DRM Protected Media** | Netflix, Spotify, Disney+, encrypted DASH widevine streams. | Detected and rejected: "This content is DRM-protected and cannot be downloaded." |
| 3.4 | **Login / Age-Restricted / Private Videos** | Video requires platform login or age confirmation. | Specific error categories returned: "This video requires login or is age-restricted / private." |
| 3.5 | **Missing / Incomplete Metadata** | Videos without duration, view count, uploader name, or description. | Schema defaults to safe fallbacks (empty string, 0, None) without rendering "undefined" or "NaN". |
| 3.6 | **Special Characters, RTL, CJK & Emojis in Titles** | Titles with Arabic, Hebrew, Japanese Kanji, Hindi Devanagari, or complex emoji sequences. | Unicode UTF-8 normalization, HTML escaping on output, and `dir="auto"` container attributes. |

---

## 4. Video Playback & Range Streaming

| # | Edge Case | Discovered Scenario | Resolution / Implementation |
|---|---|---|---|
| 4.1 | **Browser Seeking with HTTP Range Requests** | User scrubs forward/backward in the custom HTML5 video player. | Stream proxy handles `Range: bytes=start-end`, returns HTTP `206 Partial Content`, `Accept-Ranges: bytes`, and accurate `Content-Range`. |
| 4.2 | **Format Codec Incompatibility** | Remote video is VP9/AV1 only or separate video/audio DASH chunks. | Metadata extraction selects H.264 MP4 stream for preview; if unavailable, falls back to platform embed or thumbnail with clear note. |
| 4.3 | **Expired Stream URLs (403/410)** | CDN stream URLs expire after a short time. | Stream proxy automatically detects upstream 403/410 and triggers a single re-extraction to fetch fresh signed URLs. |
| 4.4 | **Vertical / 9:16 Videos** | Shorts, Reels, and TikToks causing layout jump. | Responsive player container with aspect ratio preservation and no stretch. |

---

## 5. Downloads, Merging & Progress

| # | Edge Case | Discovered Scenario | Resolution / Implementation |
|---|---|---|---|
| 5.1 | **Separate Video & Audio Streams** | High quality (1080p, 1440p, 4K) videos on YouTube have no embedded audio in the video track. | Auto-merged with ffmpeg using `copy` codec (fast, lossless) into MP4 container. |
| 5.2 | **Indeterminate ffmpeg Merge Stage** | Progress jumping backward or freezing at 100% during muxing. | Dedicated "Merging audio & video..." state with animated indeterminate progress bar. |
| 5.3 | **Process Tree Kill on Cancel** | Subprocess spawns child processes (yt-dlp -> ffmpeg -> ffprobe). | Download manager tracks process groups (`os.killpg(os.getpgid(p.pid), signal.SIGTERM)`) and cleans temp files immediately. |
| 5.4 | **Pause & Resume Downloads** | Interrupted or paused downloads. | Uses yt-dlp `--continue` with `.part` files if supported by upstream server. |
| 5.5 | **Forbidden Filename Characters** | Titles containing `/ \ : * ? " < > \|`, Windows reserved names (`CON`, `PRN`, `AUX`, `NUL`). | `sanitize_filename()` replaces forbidden chars with clean dashes and prepends prefix for reserved names. |
| 5.6 | **Non-ASCII / Unicode Filename Delivery (Typographic Quotes & International Chars)** | Titles with typographic quotes (`’`, `”`), Hindi, CJK, Arabic, or Cyrillic characters crashing HTTP header encoding (`UnicodeEncodeError: 'latin-1' codec can't encode character`). | `build_content_disposition_header()` normalizes typographic unicode characters and generates an ASCII-safe `filename="..."` fallback while embedding the exact UTF-8 filename in `filename*=UTF-8''...` (RFC 5987 / RFC 6266). |
| 5.7 | **Audio Postprocessing & FFprobe Detection** | `yt-dlp --extract-audio` failing with `unable to obtain file audio codec with ffprobe` when an invalid `ffprobe` binary/symlink pointing to `ffmpeg` is present. | `setup_ffmpeg_symlinks()` removes any fake `ffprobe` symlinks and only provides genuine `ffprobe` binaries, allowing `yt-dlp` to directly convert audio with `ffmpeg` cleanly without postprocessing errors. |

---

## 6. Client History & Resilience

| # | Edge Case | Discovered Scenario | Resolution / Implementation |
|---|---|---|---|
| 6.1 | **LocalStorage Quota Exceeded** | Browsers capping storage at ~5MB. | Wrapped in try/catch; automatically prunes oldest items down to capacity and alerts user. |
| 6.2 | **Corrupted LocalStorage JSON** | Invalid data saved by extension or script. | Safe parser validates schema version and resets gracefully without crashing the UI. |
| 6.3 | **Multi-Tab Sync** | User clears or adds downloads in one tab. | Listens to `window.addEventListener('storage', ...)` and synchronizes state across tabs in real-time. |
| 6.4 | **Expired Thumbnail URLs in History** | Remote thumbnail links (e.g. `ytimg.com`) expiring after days. | Graceful fallback placeholder icon when thumbnail image encounters `onError`. |
| 6.5 | **Undo Action Timeout & Race Condition** | User clicks "Clear all" and then immediately deletes another item. | 8-second timer with proper cleanup and state rollback stack. |
