import React, { useState, useEffect, useRef } from 'react';
import {
  Link as LinkIcon,
  X,
  Clipboard,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  Film,
  Music,
  Sparkles,
  Zap,
  ArrowDownCircle,
} from 'lucide-react';
import { MorphingCtaButton } from '../ui/MorphingCtaButton';
import { PlatformTicker } from '../ui/PlatformTicker';

interface UrlInputProps {
  onFetch: (url: string) => void;
  isLoading: boolean;
  onCancelFetch?: () => void;
}

const PLACEHOLDER_PROMPTS = [
  'Paste any YouTube video or Shorts URL...',
  'Paste Instagram Reel, Post, or Story link...',
  'Paste TikTok video link without watermark...',
  'Paste X (Twitter) video or media link...',
  'Paste Facebook, Reddit, or Vimeo link...',
  'Paste SoundCloud audio or 1,000+ media URLs...',
];

export const UrlInput: React.FC<UrlInputProps> = ({ onFetch, isLoading, onCancelFetch }) => {
  const [inputVal, setInputVal] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<{ id: string; name: string; color: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholder prompts every 3.5 seconds when input is empty
  useEffect(() => {
    if (inputVal) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputVal]);

  // Fast client-side instant platform detection
  useEffect(() => {
    const raw = inputVal.toLowerCase().trim();
    if (!raw) {
      setDetectedPlatform(null);
      return;
    }

    if (raw.includes('youtube.com') || raw.includes('youtu.be')) {
      setDetectedPlatform({ id: 'youtube', name: 'YouTube', color: '#ef233c' });
    } else if (raw.includes('instagram.com') || raw.includes('instagr.am')) {
      setDetectedPlatform({ id: 'instagram', name: 'Instagram', color: '#ff4d6d' });
    } else if (raw.includes('tiktok.com')) {
      setDetectedPlatform({ id: 'tiktok', name: 'TikTok', color: '#00F2FE' });
    } else if (raw.includes('twitter.com') || raw.includes('x.com')) {
      setDetectedPlatform({ id: 'x', name: 'X / Twitter', color: '#ffffff' });
    } else if (raw.includes('facebook.com') || raw.includes('fb.watch')) {
      setDetectedPlatform({ id: 'facebook', name: 'Facebook', color: '#1877F2' });
    } else if (raw.includes('reddit.com') || raw.includes('redd.it')) {
      setDetectedPlatform({ id: 'reddit', name: 'Reddit', color: '#FF4500' });
    } else if (raw.includes('twitch.tv')) {
      setDetectedPlatform({ id: 'twitch', name: 'Twitch', color: '#9146FF' });
    } else if (raw.includes('vimeo.com')) {
      setDetectedPlatform({ id: 'vimeo', name: 'Vimeo', color: '#1AB7EA' });
    } else if (raw.includes('dailymotion.com') || raw.includes('dai.ly')) {
      setDetectedPlatform({ id: 'dailymotion', name: 'Dailymotion', color: '#0066DC' });
    } else if (raw.includes('soundcloud.com')) {
      setDetectedPlatform({ id: 'soundcloud', name: 'SoundCloud', color: '#FF5500' });
    } else if (raw.endsWith('.mp4') || raw.endsWith('.mp3') || raw.endsWith('.m3u8')) {
      setDetectedPlatform({ id: 'direct', name: 'Direct Media', color: '#10B981' });
    } else if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('.')) {
      setDetectedPlatform({ id: 'generic', name: 'Web Media', color: '#ef233c' });
    } else {
      setDetectedPlatform(null);
    }
  }, [inputVal]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputVal.trim();
    if (!clean || isLoading) return;
    onFetch(clean);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputVal(text);
        onFetch(text.trim());
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setInputVal('');
    setDetectedPlatform(null);
    inputRef.current?.focus();
  };

  // Drag & drop link handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (droppedText) {
      setInputVal(droppedText.trim());
      onFetch(droppedText.trim());
    }
  };

  return (
    <div id="url-input" className="w-full max-w-4xl mx-auto scroll-mt-28">
      {/* Radiant Kinetic Rotating Glow Animation */}
      <style>{`
        @property --rotation {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        
        @keyframes rotateRadiantBorder {
          0% {
            --rotation: 0deg;
          }
          100% {
            --rotation: 360deg;
          }
        }

        .radiant-input-container {
          --border-size: 2px;
          --gradient-conic: conic-gradient(
            from var(--rotation) at 50% 50%,
            #ef233c 0%,
            #ff0055 25%,
            #ff758c 45%,
            #800020 60%,
            #ef233c 100%
          );
          animation: rotateRadiantBorder 5s linear infinite;
        }

        .radiant-input-container::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          background: var(--gradient-conic);
          z-index: 0;
          filter: blur(14px);
          opacity: 0.55;
          transition: opacity 0.3s ease, filter 0.3s ease;
        }

        .radiant-input-container:focus-within::before,
        .radiant-input-container.is-drag-over::before {
          opacity: 0.95;
          filter: blur(20px);
        }

        .radiant-input-border {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: var(--border-size);
          background: var(--gradient-conic);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* Top Center MVP Focal Callout Pill */}
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950/90 border border-[#ef233c]/40 shadow-[0_0_20px_rgba(239,35,60,0.3)] backdrop-blur-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]" />
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-white font-manrope tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ef233c]" />
            <span>Paste Media Link Below to Download</span>
          </span>
        </div>
      </div>

      {/* Main Input Form with Glowing Glass Container */}
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative z-10"
      >
        <div
          className={`radiant-input-container relative rounded-full bg-zinc-950/90 backdrop-blur-2xl shadow-[0_0_80px_rgba(239,35,60,0.35)] transition-all duration-300 ${
            isDragOver ? 'is-drag-over ring-4 ring-[#ef233c]/80 scale-[1.01]' : ''
          }`}
        >
          {/* Animated Radiant Gradient Border */}
          <div className="radiant-input-border rounded-full" />

          <div className="relative z-10 flex items-center p-2 sm:p-2.5">
            {/* Left Icon / Detected Platform Badge */}
            <div className="pl-3 sm:pl-4 pr-2 flex items-center shrink-0">
              {detectedPlatform ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/10 shadow-sm border border-white/15 animate-in fade-in zoom-in-90 duration-200">
                  {detectedPlatform.id === 'youtube' && <Youtube className="w-4 h-4 text-[#ef233c]" />}
                  {detectedPlatform.id === 'instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                  {detectedPlatform.id === 'x' && <Twitter className="w-4 h-4 text-white" />}
                  {detectedPlatform.id === 'facebook' && <Facebook className="w-4 h-4 text-blue-400" />}
                  {detectedPlatform.id === 'direct' && <Film className="w-4 h-4 text-emerald-400" />}
                  {detectedPlatform.id === 'soundcloud' && <Music className="w-4 h-4 text-orange-400" />}
                  {['generic', 'reddit', 'twitch', 'vimeo', 'dailymotion', 'tiktok'].includes(detectedPlatform.id) && (
                    <Globe className="w-4 h-4 text-[#ef233c]" />
                  )}
                  <span className="hidden sm:inline font-manrope">{detectedPlatform.name}</span>
                </span>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#ef233c]/15 text-[#ef233c] flex items-center justify-center border border-[#ef233c]/30 shadow-[0_0_15px_rgba(239,35,60,0.3)]">
                  <LinkIcon className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Main URL Text Input with High-Contrast Typography */}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={PLACEHOLDER_PROMPTS[placeholderIndex]}
              disabled={isLoading}
              className="w-full bg-transparent px-3 py-3 text-sm md:text-base font-medium text-white placeholder:text-zinc-400 outline-none disabled:opacity-50 font-inter tracking-wide"
              aria-label="Media link URL input"
            />

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 pr-1 shrink-0">
              {/* Clear Button */}
              {inputVal && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Clear input"
                  title="Clear text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Paste Button (Prominent Glowing Accent) */}
              {!inputVal && !isLoading && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-[#ef233c]/25 border border-white/15 hover:border-[#ef233c]/50 shadow-sm transition-all cursor-pointer transform active:scale-95"
                  aria-label="Paste from clipboard"
                  title="Paste link from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-[#ef233c]" />
                  <span>Paste</span>
                </button>
              )}

              {/* Cancel Button if Loading */}
              {isLoading && onCancelFetch && (
                <button
                  type="button"
                  onClick={onCancelFetch}
                  className="px-3 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {/* Interactive Morphing CTA Button */}
              <MorphingCtaButton
                type="submit"
                isLoading={isLoading}
                idleText="Fetch Media"
                activeText="Analyzing..."
                disabled={!inputVal.trim()}
              />
            </div>
          </div>
        </div>
      </form>

      {/* Under-Input Guidance & Guarantees Strip */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 px-4 text-[11.5px] text-zinc-400 font-inter">
        <div className="flex items-center gap-2">
          <ArrowDownCircle className="w-3.5 h-3.5 text-[#ef233c]" />
          <span>Supports YouTube, Instagram, TikTok, X, Reddit, Vimeo & 1,000+ sites</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-zinc-300 font-medium">
            <Zap className="w-3 h-3 text-[#ef233c]" />
            <span>4K 60fps & 320k MP3</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">100% Free & No Ads</span>
        </div>
      </div>

      {/* Horizontally Scrolling Platform Ticker */}
      <div className="mt-8">
        <PlatformTicker />
      </div>
    </div>
  );
};

export default UrlInput;

