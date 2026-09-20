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
} from 'lucide-react';
import { MorphingCtaButton } from '../ui/MorphingCtaButton';
import { PlatformTicker } from '../ui/PlatformTicker';

interface UrlInputProps {
  onFetch: (url: string) => void;
  isLoading: boolean;
  onCancelFetch?: () => void;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onFetch, isLoading, onCancelFetch }) => {
  const [inputVal, setInputVal] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<{ id: string; name: string; color: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Radiant Prompt Input with Kinetic Rotating Gradient Border */}
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
          animation: rotateRadiantBorder 6s linear infinite;
        }

        .radiant-input-container::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          background: var(--gradient-conic);
          z-index: 0;
          filter: blur(10px);
          opacity: 0.45;
          transition: opacity 0.3s ease;
        }

        .radiant-input-container:focus-within::before {
          opacity: 0.85;
          filter: blur(14px);
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

      {/* Input Bar Form */}
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="radiant-input-container relative rounded-full bg-zinc-950/80 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] transition-all duration-300">
          {/* Animated Gradient Border */}
          <div className="radiant-input-border rounded-full" />

          <div className="relative z-10 flex items-center p-2 sm:p-2.5">
            {/* Left Icon / Detected Platform Badge */}
            <div className="pl-4 pr-2 flex items-center shrink-0">
              {detectedPlatform ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/10 shadow-sm border border-white/15 animate-in fade-in zoom-in-90 duration-200">
                  {detectedPlatform.id === 'youtube' && <Youtube className="w-3.5 h-3.5 text-[#ef233c]" />}
                  {detectedPlatform.id === 'instagram' && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                  {detectedPlatform.id === 'x' && <Twitter className="w-3.5 h-3.5 text-white" />}
                  {detectedPlatform.id === 'facebook' && <Facebook className="w-3.5 h-3.5 text-blue-400" />}
                  {detectedPlatform.id === 'direct' && <Film className="w-3.5 h-3.5 text-emerald-400" />}
                  {detectedPlatform.id === 'soundcloud' && <Music className="w-3.5 h-3.5 text-orange-400" />}
                  {['generic', 'reddit', 'twitch', 'vimeo', 'dailymotion', 'tiktok'].includes(detectedPlatform.id) && (
                    <Globe className="w-3.5 h-3.5 text-[#ef233c]" />
                  )}
                  <span className="hidden sm:inline font-manrope">{detectedPlatform.name}</span>
                </span>
              ) : (
                <LinkIcon className="w-5 h-5 text-zinc-500" />
              )}
            </div>

            {/* Main URL Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Paste any media link (YouTube, Instagram, TikTok, X, Reddit, Vimeo...)"
              disabled={isLoading}
              className="w-full bg-transparent px-3 py-3 text-sm md:text-base font-normal text-white placeholder-zinc-500 outline-none disabled:opacity-50 font-inter"
              aria-label="Media link URL input"
            />

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 pr-1 shrink-0">
              {/* Clear Button */}
              {inputVal && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Paste Button */}
              {!inputVal && !isLoading && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                  aria-label="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-[#ef233c]" />
                  Paste
                </button>
              )}

              {/* Cancel Button if Loading */}
              {isLoading && onCancelFetch && (
                <button
                  type="button"
                  onClick={onCancelFetch}
                  className="px-3 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Cancel
                </button>
              )}

              {/* Interactive Morphing CTA Button with Star Icon & Letter-by-Letter Text Swap */}
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

      {/* Horizontally Scrolling Platform Ticker with Gradient Fade & Hover-Pause */}
      <div className="mt-10">
        <PlatformTicker />
      </div>
    </div>
  );
};

export default UrlInput;
