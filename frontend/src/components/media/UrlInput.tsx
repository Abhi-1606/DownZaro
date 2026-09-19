import React, { useState, useEffect, useRef } from 'react';
import {
  Link as LinkIcon,
  X,
  Clipboard,
  Loader2,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  Film,
  Music,
  ArrowRight,
} from 'lucide-react';

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
      {/* Input Bar Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center rounded-full bg-zinc-950/70 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] hover:border-white/20 focus-within:border-[#ef233c] focus-within:shadow-[0_0_30px_rgba(239,35,60,0.25)] transition-all duration-300 p-2 sm:p-2.5">
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
                <span>{detectedPlatform.name}</span>
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

            {/* Submit / Loading Button */}
            {isLoading ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancelFetch}
                  className="px-3 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Cancel
                </button>
                <div className="px-5 py-2.5 rounded-full bg-[#ef233c] text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#ef233c]/40 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="shiny-cta group !py-2.5 !px-6 disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                  Fetch Media <ArrowRight className="w-3.5 h-3.5 text-[#ef233c] group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Platform Logo Strip (From Reference Design) */}
      <div className="w-full mt-14 border-y border-white/5 bg-white/[0.01] backdrop-blur-sm py-6 opacity-60 hover:opacity-100 transition-opacity">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase shrink-0 font-manrope">
            Supported Sources:
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 items-center w-full text-xs font-semibold font-manrope text-zinc-400">
            <div className="flex items-center gap-2 hover:text-white transition-colors"><div className="w-2 h-2 rounded-full bg-[#ef233c]" />YouTube 4K</div>
            <div className="flex items-center gap-2 hover:text-white transition-colors"><div className="w-2 h-2 rounded-full bg-[#ef233c]" />Instagram Reels</div>
            <div className="flex items-center gap-2 hover:text-white transition-colors"><div className="w-2 h-2 rounded-full bg-[#ef233c]" />TikTok No Watermark</div>
            <div className="flex items-center gap-2 hover:text-white transition-colors"><div className="w-2 h-2 rounded-full bg-[#ef233c]" />X / Twitter</div>
            <div className="flex items-center gap-2 hover:text-white transition-colors"><div className="w-2 h-2 rounded-full bg-[#ef233c]" />Reddit</div>
            <div className="flex items-center gap-2 hover:text-white transition-colors"><div className="w-2 h-2 rounded-full bg-[#ef233c]" />Vimeo / 1000+</div>
          </div>
        </div>
      </div>
    </div>
  );
};
