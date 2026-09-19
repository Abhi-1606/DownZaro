# DownZaro 🚀

<div align="center">
  <img src="frontend/public/favicon.svg" width="96" height="96" alt="DownZaro Logo" />
  <h1>DownZaro • Red Noir Edition</h1>
  <p><strong>Universal Media Downloader & Progressive Web App</strong></p>
  <p><em>Capture 4K videos, studio-grade 320kbps MP3s, and HD artwork from 1,000+ platforms at native speeds with zero ads.</em></p>

  <p>
    <a href="#-key-features">Key Features</a> •
    <a href="#-red-noir-aesthetic">Design System</a> •
    <a href="#-app-installation-pwa">Install as App</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-security--architecture">Security</a> •
    <a href="#-automated-testing">Testing</a>
  </p>
</div>

---

## ✨ Key Features

- 🎬 **Multi-Platform Support**: YouTube, Instagram (Reels & Posts), TikTok, Facebook, X (Twitter), Reddit, Twitch clips, Vimeo, Dailymotion, SoundCloud, and 1,000+ sites.
- ⚡ **Full Resolution & Format Freedom**:
  - **Video**: Crisp MP4 downloads up to 4K / 1080p (24/30/60fps) with automatic ffmpeg audio merging.
  - **Audio**: Studio-grade 320 kbps, 192 kbps, and 128 kbps MP3 conversion with embedded artwork metadata and AAC/M4A streams.
  - **Thumbnails & Art**: Original high-resolution cover image extractor (`1920x1080`).
  - **All-in-One Bundle**: 1-click ZIP package containing video, audio, and thumbnail.
- 📺 **In-App Media Preview**: Directly inspect and play embedded video/audio before downloading.
- 📡 **Real-Time Progress**: Live Server-Sent Events (SSE) displaying transfer rate (MB/s), ETA, and ffmpeg muxing state.
- 🗂️ **Local History & Undo**: Browser-isolated download history with search and 8-second quick undo recovery.
- 📲 **Universal PWA**: Native app experience across Apple Mac, iPhone/iPad (iOS), Windows, and Android.

---

## 🎨 Red Noir Aesthetic

Built with high-contrast, premium dark mode aesthetics:
- **Obsidian & Crimson Palette**: Pure `#000000` base with `#1a0505` radial glow and `#ef233c` crimson brand highlights.
- **Typography**: [Manrope](https://fonts.google.com/specimen/Manrope) for bold numbers and headlines; [Inter](https://fonts.google.com/specimen/Inter) for clean UI reading.
- **Micro-Animations**: Houdini CSS conic-gradient rotating borders, interactive Bento Grid tiles, and ambient parallax starfield drift (`.stars-1`, `.stars-2`).
- **Dismissible Notifications**: Direct `X` close actions on download cards and bulk "Dismiss all completed" functionality.

---

## 📱 App Installation (PWA)

DownZaro can be installed as a standalone desktop or mobile application without app store restrictions:

| Platform | How to Install |
| :--- | :--- |
| 🍏 **Apple iPhone / iPad (iOS)** | Open in Safari ➔ Tap **Share** (`⎘`) ➔ Tap **"Add to Home Screen"** (`⊞`). Runs full-screen with native app icon. |
| 💻 **Apple Mac (macOS)** | In Safari (macOS Sonoma+): **File ➔ Add to Dock...** or click **"Install App"** in Chrome / Edge. |
| 🪟 **Windows (PC / Laptop)** | Click **"Install App"** in the top-right header or address bar prompt to pin to Start Menu and Taskbar. |
| 📱 **Android Phones & Tablets** | Tap **"Install App"** or browser menu (`⋮`) ➔ **"Add to Home screen"**. |

---

## 🛠️ Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **ffmpeg** on system PATH (or installed via `brew install ffmpeg` / `apt install ffmpeg`)

### 1. Start the FastAPI Backend
```bash
# Set up Python virtual environment
python3 -m venv backend/venv
./backend/venv/bin/pip install -r backend/requirements.txt

# Launch FastAPI backend server
./backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the React Frontend
```bash
# In a new terminal tab:
cd frontend
npm install
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🛡️ Security & Architecture

- **SSRF Hardening**: Custom IPv4/IPv6 resolver rejects requests targeting loopback (`127.0.0.0/8`, `::1`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local, and cloud metadata endpoints (`169.254.169.254`).
- **Safe Command Execution**: Never invokes shell strings (`shell=False`). CLI arguments are passed discretely with explicit `--` command boundaries.
- **RFC 5987 Unicode Delivery**: Content-Disposition headers support full international Unicode titles (`filename*=UTF-8''...`) with sanitized 7-bit ASCII fallbacks to prevent serializer crashes.
- **Sliding-Window Rate Limiting**: Protects backend compute resources from abuse.
- **Automated Lifecycle Purge**: Temporary media files are strictly isolated in temporary directories and wiped within 30 minutes.

---

## 🧪 Automated Testing

```bash
# Run backend test suite (unit + security validation)
PYTHONPATH=. ./backend/venv/bin/pytest -v backend/tests

# Run frontend TypeScript type checking and production build
npm run build --prefix frontend
```

---

## 📄 License
This project is open-source under the MIT License. Intended for personal, non-commercial use for content you have rights or permission to save.
