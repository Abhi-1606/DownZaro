import React from 'react';
import { Link2, Sliders, ArrowDownCircle } from 'lucide-react';

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
    <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5 relative z-10">
      <div className="text-center mb-16 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef233c] animate-pulse"></span>
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-manrope">
            Simple Workflow
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-4">
          How <span className="text-[#ef233c]">DownZaro</span> Works
        </h2>
        <p className="text-zinc-400 text-base max-w-xl mx-auto">
          Three effortless steps to capture high-definition media from anywhere on the web.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="relative p-8 rounded-2xl bg-gradient-to-b from-zinc-900/60 to-black/80 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center group hover:border-[#ef233c]/40 transition-all duration-300"
            >
              {/* Step Number Badge */}
              <div className="absolute -top-3.5 px-3.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-white bg-[#ef233c] shadow-[0_0_15px_rgba(239,35,60,0.5)] font-manrope">
                STEP {step.num}
              </div>

              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-[#ef233c] flex items-center justify-center mb-6 mt-3 group-hover:scale-110 group-hover:border-[#ef233c]/30 group-hover:bg-[#ef233c]/10 transition-all duration-300 shadow-inner">
                <Icon className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-white font-manrope mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs font-inter">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

