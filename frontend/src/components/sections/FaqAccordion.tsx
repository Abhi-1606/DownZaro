import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Which platforms are supported by DownZaro?',
      a: 'DownZaro supports YouTube, Instagram (Reels & Posts), TikTok, Facebook, X (formerly Twitter), Reddit, Twitch clips, Vimeo, Dailymotion, SoundCloud, and over 1,000+ public video websites powered by our core extraction engine.',
    },
    {
      q: 'Can I download audio tracks as 320kbps MP3?',
      a: 'Yes! DownZaro provides studio-quality 320 kbps, 192 kbps, and 128 kbps MP3 conversion as well as original AAC/M4A streams, complete with embedded metadata and cover artwork.',
    },
    {
      q: 'Is DownZaro completely free to use?',
      a: 'Yes, DownZaro is 100% free with no subscription, no hidden paywalls, and no intrusive advertisements or third-party trackers.',
    },
    {
      q: 'Why does a download sometimes fail or take longer?',
      a: 'Downloads can fail if a video is set to private, age-restricted requiring account authentication, or DRM protected (such as Netflix/Spotify). DownZaro continuously updates its extraction engines for maximum reliability.',
    },
    {
      q: 'Are downloaded files saved or tracked on your servers?',
      a: 'No. Temporary media files generated during format merging are stored in isolated temporary directories and automatically wiped within 30 minutes after delivery.',
    },
    {
      q: 'Can I download YouTube playlists or channels?',
      a: 'To guarantee instant conversion speeds and protect server stability, DownZaro processes the single video URL provided. If you paste a watch link with playlist parameters, only that single video is fetched.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 px-6 max-w-4xl mx-auto border-t border-white/5 relative z-10">
      <div className="text-center mb-16 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
          <HelpCircle className="w-3.5 h-3.5 text-[#ef233c]" />
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-manrope">
            Got Questions?
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-4">
          Frequently Asked <span className="text-[#ef233c]">Questions</span>
        </h2>
        <p className="text-zinc-400 text-base">
          Clear answers about formats, quality, and platform support.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'bg-gradient-to-b from-zinc-900/80 to-black/90 border-[#ef233c]/40 shadow-[0_0_20px_rgba(239,35,60,0.1)]'
                  : 'bg-black/60 border-white/10 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 text-base font-semibold text-white hover:text-[#ef233c] transition-colors cursor-pointer font-manrope"
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#ef233c]' : 'text-zinc-500'
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-sm text-zinc-400 leading-relaxed border-t border-white/5 font-inter">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

