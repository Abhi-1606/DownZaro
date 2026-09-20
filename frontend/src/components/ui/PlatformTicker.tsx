import React from 'react';
import {
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Film,
  Music,
  Tv,
  Globe,
  Radio,
  Zap,
} from 'lucide-react';

interface PlatformItem {
  id: string;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PLATFORMS: PlatformItem[] = [
  { id: 'youtube', name: 'YouTube 4K & Shorts', badge: 'UHD 60fps', icon: Youtube, color: '#ef233c' },
  { id: 'instagram', name: 'Instagram Reels', badge: 'Lossless Audio', icon: Instagram, color: '#ff4d6d' },
  { id: 'tiktok', name: 'TikTok HD', badge: 'No Watermark', icon: Film, color: '#00F2FE' },
  { id: 'x', name: 'X / Twitter', badge: '1080p Video', icon: Twitter, color: '#ffffff' },
  { id: 'facebook', name: 'Facebook Watch', badge: 'HQ Media', icon: Facebook, color: '#1877F2' },
  { id: 'reddit', name: 'Reddit Media', badge: 'Audio Merged', icon: Globe, color: '#FF4500' },
  { id: 'soundcloud', name: 'SoundCloud HQ', badge: '320 kbps MP3', icon: Music, color: '#FF5500' },
  { id: 'vimeo', name: 'Vimeo Pro', badge: 'Original Bitrate', icon: Tv, color: '#1AB7EA' },
  { id: 'twitch', name: 'Twitch Clips & VODs', badge: 'Source Quality', icon: Radio, color: '#9146FF' },
  { id: 'engine', name: 'FFmpeg Muxer', badge: 'In-Memory M4S', icon: Zap, color: '#ef233c' },
];

export const PlatformTicker: React.FC = () => {
  return (
    <div className="w-full relative py-6 overflow-hidden border-y border-white/5 bg-zinc-950/40 backdrop-blur-md">
      {/* Left Gradient Edge Fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />

      {/* Right Gradient Edge Fade */}
      <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      {/* Ticker Container with Pause on Hover */}
      <div className="flex w-max ticker-track hover:[animation-play-state:paused] cursor-default select-none">
        {/* We repeat the platform list twice to make a seamless infinite loop */}
        {[...PLATFORMS, ...PLATFORMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.id}-${idx}`}
              className="flex items-center gap-3 px-6 py-2 mx-2 rounded-full bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-200 group"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform"
                style={{ color: item.color }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors font-manrope whitespace-nowrap">
                  {item.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 whitespace-nowrap">
                  {item.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-track {
          animation: tickerScroll 28s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PlatformTicker;
