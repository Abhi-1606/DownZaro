import React from 'react';
import { Link2, Sliders, ArrowDownCircle } from 'lucide-react';
import { GlowingEdgeCard } from '../ui/GlowingEdgeCard';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: Link2,
      title: 'Paste Any Link',
      desc: 'Copy media URL from YouTube, Instagram, TikTok, Facebook, X, or Reddit and paste it into DownZaro.',
    },
    {
      num: '02',
      icon: Sliders,
      title: 'Choose Quality & Format',
      desc: 'Preview directly, pick your preferred resolution (up to 4K), extract 320k MP3 audio, or grab the cover art.',
    },
    {
      num: '03',
      icon: ArrowDownCircle,
      title: 'Direct High-Speed Download',
      desc: 'Download directly to your device at native server speed with zero queueing, paywalls, or throttling.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5 relative z-10 scroll-mt-24">
      <div className="text-center mb-14 sm:mb-16 animate-fade-up max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef233c] animate-pulse"></span>
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-manrope">
            Simple Workflow
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-4">
          How <span className="text-[#ef233c]">DownZaro</span> Works
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto font-inter font-light">
          Three effortless steps to capture high-definition media from anywhere on the web.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative items-stretch">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <GlowingEdgeCard
              key={idx}
              className="h-full min-h-[320px]"
            >
              <div className="p-8 flex flex-col items-center text-center h-full justify-between">
                {/* Step Number Badge */}
                <div className="px-3.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-white bg-[#ef233c] shadow-[0_0_15px_rgba(239,35,60,0.5)] font-manrope">
                  STEP {step.num}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-[#ef233c] flex items-center justify-center my-6 group-hover:scale-110 group-hover:border-[#ef233c]/30 group-hover:bg-[#ef233c]/10 transition-all duration-300 shadow-inner">
                  <Icon className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white font-manrope mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-inter font-light">
                    {step.desc}
                  </p>
                </div>
              </div>
            </GlowingEdgeCard>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
