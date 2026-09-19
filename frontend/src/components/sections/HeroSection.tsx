import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Download } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="text-center pt-28 sm:pt-36 pb-6 px-4 max-w-5xl mx-auto">
      {/* 1. Live Status Announcement Pill */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-up shadow-[0_0_20px_rgba(239,35,60,0.15)]"
        style={{ animationDelay: '0.1s' }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]" />
        </span>
        <span className="text-xs font-medium text-red-100/90 tracking-wide font-manrope">
          DownZaro 2.0 • Link it • Download it • Keep it
        </span>
        <ArrowRight className="w-3 h-3 text-[#ef233c]" />
      </div>

      {/* 2. Massive Manrope Hero Heading */}
      <h1
        className="text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tighter font-manrope leading-[1.08] mb-6 animate-fade-up"
        style={{ animationDelay: '0.2s' }}
      >
        <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
          Media Intelligence
        </span>
        <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
          for the{' '}
          <span className="text-[#ef233c] inline-block relative">
            Future
            <svg
              className="absolute w-full h-3 -bottom-2 left-0 text-[#ef233c] opacity-70"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2.5" fill="none" />
            </svg>
          </span>
        </span>
      </h1>

      {/* 3. Hero Subtitle */}
      <p
        className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-inter font-light animate-fade-up"
        style={{ animationDelay: '0.3s' }}
      >
        Your Media, Your Way. High-speed lossless downloading for 4K video, 320kbps MP3 audio, and HD covers from 1,000+ sites.
      </p>

      {/* 4. Quick Feature Badges */}
      <div
        className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-zinc-400 mb-8 font-inter animate-fade-up"
        style={{ animationDelay: '0.4s' }}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <Zap className="w-3.5 h-3.5 text-[#ef233c]" />
          <span>Zero Ads & Popups</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-[#ef233c]" />
          <span>Encrypted In-Memory Processing</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <Download className="w-3.5 h-3.5 text-[#ef233c]" />
          <span>4K Ultra HD & 320k Audio</span>
        </div>
      </div>
    </section>
  );
};
