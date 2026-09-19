import React from 'react';
import { Logo } from '../../assets/brand/Logo';
import { HealthInfo } from '../../utils/types';
import { Star, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (type: 'terms' | 'privacy' | 'dmca') => void;
  healthInfo?: HealthInfo | null;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, healthInfo }) => {
  return (
    <>
      {/* 1. High-Contrast Red Noir Testimonial Banner (From Reference) */}
      <div className="w-full bg-[#ef233c] py-16 px-6 mt-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1.5 text-black mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-current text-black" />
            ))}
          </div>
          <h3 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black font-manrope leading-tight mb-6 tracking-tight">
            "DownZaro has completely transformed how we organize and archive media. What used to take complicated command-line setups now takes seconds."
          </h3>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <ShieldCheck className="text-[#ef233c] w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-black font-extrabold text-base font-manrope">FASTER DOWNLOADS • MORE POSSIBILITIES</div>
              <div className="text-black/80 font-medium text-xs">High-Speed Cloud Muxing Engine</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Red Noir Footer */}
      <footer className="bg-black border-t border-zinc-900 pt-20 pb-10 relative overflow-hidden font-inter">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 relative z-10">
          <div className="md:col-span-2">
            <div className="mb-4">
              <Logo size={32} showWordmark={true} showTagline={true} />
            </div>
            <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
              Pioneering high-speed, privacy-first media downloads with modern stream muxing and zero ads.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthInfo?.status === 'healthy' ? 'bg-[#ef233c] animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>Engine yt-dlp {healthInfo?.ytdlp_version || '2026.08.19'} • FFmpeg 7.1 Muxer Active</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#ef233c] uppercase tracking-widest mb-5 font-manrope">
              Supported Formats
            </h4>
            <ul className="space-y-3 text-zinc-400 text-sm">
              <li className="hover:text-white transition-colors">4K / 1080p MP4 Video</li>
              <li className="hover:text-white transition-colors">320kbps Lossless MP3</li>
              <li className="hover:text-white transition-colors">Apple AAC M4A</li>
              <li className="hover:text-white transition-colors">Original HD Cover Art</li>
              <li className="hover:text-white transition-colors">All-in-One ZIP Archive</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#ef233c] uppercase tracking-widest mb-5 font-manrope">
              Legal & Trust
            </h4>
            <ul className="space-y-3 text-zinc-400 text-sm">
              <li>
                <button
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('dmca')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  DMCA & Copyright
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Huge Outline Watermark (From Reference) */}
        <div className="flex justify-center items-center py-6 opacity-20 pointer-events-none">
          <h1 className="text-[13vw] leading-none font-black font-manrope tracking-tighter text-stroke select-none">
            DOWNZARO
          </h1>
        </div>

        {/* Bottom Credits Bar */}
        <div className="max-w-7xl mx-auto px-6 border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between text-zinc-600 text-[10px] uppercase tracking-widest font-manrope">
          <p>© {new Date().getFullYear()} DownZaro Media Intelligence. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0 text-zinc-500">
            <span>Clean</span>
            <span>•</span>
            <span>Fast</span>
            <span>•</span>
            <span>Secure</span>
          </div>
        </div>
      </footer>
    </>
  );
};
