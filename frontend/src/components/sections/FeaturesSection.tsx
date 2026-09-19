import React from 'react';
import { Bot, Music, Zap, Layers, ArrowRight } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-28 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-20 text-center max-w-3xl mx-auto animate-fade-up">
        <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">
          The Operating System for <br />
          <span className="text-[#ef233c]">High-Fidelity Media Downloads</span>
        </h2>
        <p className="text-lg text-zinc-400 font-light font-inter">
          Replace broken, ad-ridden converter sites with one cohesive, privacy-first platform powered by ultra-fast cloud engine.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto lg:h-[650px]">
        {/* Main Large Feature Card (Col 2, Row 2) */}
        <div className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden p-8 border border-white/10 bg-gradient-to-b from-zinc-900/60 to-black hover:border-white/25 transition-all rounded-2xl flex flex-col justify-between">
          <div className="relative z-10">
            <div className="mb-6 inline-flex p-3 rounded-xl bg-white/5 border border-white/10 text-[#ef233c]">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-semibold text-white font-manrope mb-4 tracking-tight">
              Automated Muxing & M4S Engine
            </h3>
            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-inter font-light">
              High-resolution 4K and 1080p YouTube videos separate video and audio channels. DownZaro’s background ffmpeg pipeline automatically muxes lossless streams into universal MP4 with zero quality loss.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            <span className="text-xs font-mono font-bold tracking-wider text-[#ef233c]">LOSSLESS MERGING ENGINE</span>
            <ArrowRight className="w-4 h-4 text-[#ef233c]" />
          </div>

          {/* Red Ambient Radial Glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, #ef233c, transparent 70%)' }}
          />
        </div>

        {/* Feature 2: Audio Studio (Col 2) */}
        <div className="lg:col-span-2 group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/25 transition-all rounded-2xl flex flex-col justify-between">
          <div className="relative z-10">
            <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 border border-white/10 text-emerald-400">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-semibold text-white font-manrope mb-2 tracking-tight">
              Studio Audio Extraction (320 kbps MP3)
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-inter">
              Extract high-bitrate MP3 and M4A tracks with clean metadata and embedded artwork, ready for Apple Music, Spotify, and DJ sets.
            </p>
          </div>
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, #10B981, transparent 70%)' }}
          />
        </div>

        {/* Feature 3: Smart Iteration */}
        <div className="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/25 transition-all rounded-2xl flex flex-col justify-between">
          <div className="relative z-10">
            <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 border border-white/10 text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white font-manrope mb-2 tracking-tight">
              Zero Ads & Zero Lag
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-inter">
              No invasive redirects, popups, or fake download buttons. Pure high-speed direct downloads.
            </p>
          </div>
        </div>

        {/* Feature 4: All-in-One ZIP */}
        <div className="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/25 transition-all rounded-2xl flex flex-col justify-between">
          <div className="relative z-10">
            <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 border border-white/10 text-rose-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white font-manrope mb-2 tracking-tight">
              All-in-One Bundles
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-inter">
              Download the 4K video, 320k audio, and HD cover art packaged together in a single ZIP archive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
