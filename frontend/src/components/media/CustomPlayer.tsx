import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PictureInPicture,
  RotateCcw,
  Film,
  Sparkles,
} from 'lucide-react';

interface CustomPlayerProps {
  streamUrl?: string | null;
  embedUrl?: string | null;
  thumbnailUrl?: string | null;
  title: string;
  startSeconds?: number;
  durationFormatted?: string;
  isShort?: boolean;
}

export const CustomPlayer: React.FC<CustomPlayerProps> = ({
  streamUrl,
  embedUrl,
  thumbnailUrl,
  title,
  startSeconds = 0,
  durationFormatted,
  isShort = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback mode: whether active playback has been initiated by the user
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasStreamError, setHasStreamError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Reset when media changes
  useEffect(() => {
    setHasStarted(false);
    setIsPlaying(false);
    setHasStreamError(false);
    setCurrentTime(0);
  }, [embedUrl, streamUrl, title]);

  // Set initial timestamp if present
  useEffect(() => {
    if (videoRef.current && startSeconds > 0) {
      videoRef.current.currentTime = startSeconds;
    }
  }, [startSeconds, streamUrl]);

  // Sync buffer & time for HTML5 video
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered(bufferedEnd);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setHasStreamError(false);
  };

  const handleStartPlayback = () => {
    setHasStarted(true);
    setHasStreamError(false);
    if (streamUrl && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    setVolume(val);
    videoRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  };

  const cycleSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [1, 1.25, 1.5, 2, 0.5];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    videoRef.current.playbackRate = nextSpeed;
  };

  // Keyboard navigation shortcuts when HTML5 video is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (!hasStarted) return;

      if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.min(duration, currentTime + 5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isPlaying, isMuted, duration, currentTime]);

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine iframe source with autoplay
  const getEmbedSource = () => {
    if (!embedUrl) return '';
    const separator = embedUrl.includes('?') ? '&' : '?';
    return `${embedUrl}${separator}autoplay=1&enablejsapi=1`;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative w-full rounded-2xl overflow-hidden bg-black/95 shadow-2xl border border-white/10 group select-none flex items-center justify-center ${
        isShort ? 'aspect-[9/16] max-h-[560px] mx-auto' : 'aspect-video'
      }`}
    >
      {/* 1. ACTIVE HTML5 VIDEO STREAM PLAYER (Primary) */}
      {hasStarted && streamUrl && !hasStreamError ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={streamUrl}
            poster={thumbnailUrl || undefined}
            playsInline
            autoPlay
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              setHasStreamError(true);
            }}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Buffering Spinner */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 pointer-events-none">
              <div className="w-12 h-12 rounded-full border-4 border-[#ef233c]/30 border-t-[#ef233c] animate-spin" />
            </div>
          )}

          {/* Center Play/Pause Overlay */}
          {!isPlaying && !isBuffering && (
            <button
              onClick={togglePlay}
              className="absolute z-20 p-5 rounded-full bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white shadow-2xl shadow-[#ef233c]/50 transform hover:scale-110 active:scale-95 transition-all duration-200 border border-white/30 cursor-pointer"
              aria-label="Play video"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}

          {/* Top Floating Reset Control Bar */}
          <div className="absolute top-2 right-2 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => {
                setHasStarted(false);
                setIsPlaying(false);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-black/80 hover:bg-[#ef233c] backdrop-blur-md border border-white/20 hover:border-[#ef233c] flex items-center gap-1 shadow-lg transition-all cursor-pointer"
              title="Reset to Preview Poster"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Preview</span>
            </button>
          </div>

          {/* Bottom Custom Controls Bar */}
          <div
            className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 z-30 transition-opacity duration-300 ${
              isHovering || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Seek Bar */}
            <div className="relative w-full h-2 group/slider mb-3 flex items-center">
              <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/30 transition-all duration-150"
                  style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
                />
              </div>
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#ef233c] to-[#ff4d6d] rounded-full shadow-[0_0_10px_rgba(239,35,60,0.5)]"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Controls Bottom Row */}
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 hover:text-[#ef233c] transition-colors cursor-pointer"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 hover:text-[#ef233c] transition-colors cursor-pointer"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/30 accent-[#ef233c] rounded-full cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity duration-200"
                  />
                </div>

                <span className="font-mono text-[11px] text-zinc-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={cycleSpeed}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                {document.pictureInPictureEnabled && (
                  <button
                    onClick={togglePiP}
                    className="p-1.5 hover:text-[#ef233c] transition-colors cursor-pointer"
                    title="Picture in Picture"
                  >
                    <PictureInPicture className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 hover:text-[#ef233c] transition-colors cursor-pointer"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : hasStarted && embedUrl ? (
        /* 2. ACTIVE EMBEDDED IFRAME PLAYER (Fallback when stream is unavailable) */
        <div className="relative w-full h-full">
          <iframe
            src={getEmbedSource()}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          {/* Top Floating Control Bar */}
          <div className="absolute top-2 right-2 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => {
                setHasStarted(false);
                setHasStreamError(false);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-black/80 hover:bg-[#ef233c] backdrop-blur-md border border-white/20 hover:border-[#ef233c] flex items-center gap-1 shadow-lg transition-all cursor-pointer"
              title="Reset to Preview Poster"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Preview</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. INTERACTIVE POSTER & PLAY PREVIEW TRIGGER OVERLAY (Red & White Theme) */
        <div
          onClick={handleStartPlayback}
          className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer overflow-hidden group/poster"
        >
          {/* Background Thumbnail with subtle zoom on hover */}
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transform group-hover/poster:scale-105 transition-transform duration-500 opacity-80"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-950" />
          )}

          {/* Vignette / Glass gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30 group-hover/poster:via-black/30 transition-colors duration-300" />

          {/* Center Glowing Crimson & White Play Button */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm">
            <div className="relative mb-4">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#ef233c] to-[#ff4d6d] opacity-75 blur-lg group-hover/poster:opacity-100 group-hover/poster:scale-110 transition-all duration-300 animate-pulse shadow-[0_0_35px_rgba(239,35,60,0.7)]" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartPlayback();
                }}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#ef233c] via-[#d90429] to-[#b8001f] hover:from-[#ff3b53] hover:to-[#ef233c] text-white flex items-center justify-center shadow-2xl transform group-hover/poster:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/60 shadow-[0_0_25px_rgba(239,35,60,0.6)] cursor-pointer"
                aria-label="Play Video Preview"
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white ml-1 drop-shadow-md" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-black/75 backdrop-blur-xl border border-[#ef233c]/50 shadow-lg group-hover/poster:border-[#ef233c] group-hover/poster:shadow-[0_0_20px_rgba(239,35,60,0.35)] transition-all">
                <Sparkles className="w-3.5 h-3.5 text-[#ef233c] animate-pulse" />
                <span>Click to Play Video Preview</span>
              </span>
              <p className="text-[11px] text-zinc-300 line-clamp-1 max-w-xs drop-shadow-md font-medium">
                {title}
              </p>
            </div>
          </div>

          {/* Bottom Duration & Quality Badge (Red & White Theme) */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
            {durationFormatted && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white bg-black/85 backdrop-blur-md border border-white/15 shadow-md">
                {durationFormatted}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-black/85 backdrop-blur-md border border-[#ef233c]/50 shadow-md flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#ef233c]" />
              <span className="text-[#ef233c]">HD</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
