import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Download, Globe, Music, Sparkles } from 'lucide-react';
import { TubesBackground } from '../ui/TubesBackground';
import { UserProfile } from '../../hooks/useAuth';

interface HeroSectionProps {
  user?: UserProfile | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ user }) => {
  return (
    <TubesBackground className="w-full">
      <section className="text-center pt-28 sm:pt-36 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        {/* 1. Live Status / User Welcome Announcement Pill */}
        {user ? (
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-[#ef233c]/50 backdrop-blur-xl mb-8 animate-fade-up shadow-[0_0_25px_rgba(239,35,60,0.25)]"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]" />
            </span>
            <span className="text-xs font-semibold text-zinc-200 font-manrope">
              Hi <strong className="text-white font-bold">{user.name.split(' ')[0]}</strong>! Welcome back to <span className="text-[#ef233c] font-bold">DownZaro</span> (@{user.username})
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#ef233c]" />
          </div>
        ) : (
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
        )}

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
          className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-inter font-light animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          {user
            ? `Welcome, ${user.name}! Your lossless download stream muxer is active with zero ads and studio-quality bitrate.`
            : 'Your Media, Your Way. High-speed lossless downloading for 4K video, 320kbps MP3 audio, and HD covers from 1,000+ sites.'}
        </p>

        {/* 4. Real Capabilities & Specs Strip (Equally distributed 3-column bar) */}
        <div
          className="max-w-4xl mx-auto mb-10 p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl shadow-2xl grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/10 font-manrope animate-fade-up"
          style={{ animationDelay: '0.35s' }}
        >
          {/* Real Spec 1: Platform Support */}
          <div className="flex flex-col items-center py-2 sm:py-0 sm:px-4">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#ef233c]" />
              Platform Support
            </span>
            <div className="text-xl sm:text-2xl font-black text-white flex items-center">
              <span className="text-[#ef233c]">1,000+</span>
              <span className="text-xs font-semibold text-zinc-300 ml-1.5 font-inter">Sites Active</span>
            </div>
          </div>

          {/* Real Spec 2: Audio Ceiling */}
          <div className="flex flex-col items-center py-2 sm:py-0 sm:px-4">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#ef233c]" />
              Max Audio Bitrate
            </span>
            <div className="text-xl sm:text-2xl font-black text-white flex items-center">
              <span>320</span>
              <span className="text-xs font-semibold text-zinc-300 ml-1.5 font-mono">kbps MP3</span>
            </div>
          </div>

          {/* Real Spec 3: Video Quality */}
          <div className="flex flex-col items-center py-2 sm:py-0 sm:px-4">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ef233c]" />
              Video Ceiling
            </span>
            <div className="text-xl sm:text-2xl font-black text-white flex items-center">
              <span>4K</span>
              <span className="text-xs font-semibold text-emerald-400 ml-1.5 font-inter">60fps Lossless</span>
            </div>
          </div>
        </div>

        {/* 5. Quick Feature Badges */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-zinc-400 font-inter animate-fade-up mb-4"
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
    </TubesBackground>
  );
};

export default HeroSection;
