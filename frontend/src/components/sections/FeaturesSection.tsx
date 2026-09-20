import React from 'react';
import { MagicBento } from '../ui/MagicBento';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5 relative z-10 scroll-mt-24">
      {/* Header */}
      <div className="mb-14 sm:mb-16 text-center max-w-3xl mx-auto animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef233c] animate-ping" />
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-manrope">
            Next-Gen Architecture
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">
          The Operating System for <br />
          <span className="text-[#ef233c]">High-Fidelity Media Downloads</span>
        </h2>
        <p className="text-base sm:text-lg text-zinc-400 font-light font-inter leading-relaxed">
          Replace broken, ad-ridden converter sites with one cohesive, privacy-first platform powered by an ultra-fast cloud engine.
        </p>
      </div>

      {/* Interactive Magic Bento Grid */}
      <MagicBento
        textAutoHide={false}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={320}
        particleCount={12}
        glowColor="239, 35, 60"
      />
    </section>
  );
};

export default FeaturesSection;
