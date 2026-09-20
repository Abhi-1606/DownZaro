import React from 'react';
import { Logo } from '../../assets/brand/Logo';
import { HealthInfo } from '../../utils/types';
import {
  Star,
  ShieldCheck,
  Github,
  Twitter,
  Disc as Discord,
  Send as Telegram,
  Globe,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import { TextHoverEffect, FooterBackgroundGradient } from '../ui/hover-footer';
import AnimatedText from '../ui/animated-text';
import PulsatingDots from '../ui/pulsating-loader';

interface FooterProps {
  onOpenLegal: (type: 'terms' | 'privacy' | 'dmca') => void;
  healthInfo?: HealthInfo | null;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, healthInfo }) => {
  // Navigation / Format sections
  const formatLinks = [
    { label: '4K & 1080p MP4 Video', href: '#url-input' },
    { label: '320kbps Lossless MP3', href: '#url-input' },
    { label: 'Apple AAC M4A Audio', href: '#url-input' },
    { label: 'Original HD Cover Art', href: '#url-input' },
    { label: 'All-in-One ZIP Archive', href: '#url-input', pulse: true },
  ];

  // Social links
  const socialLinks = [
    { icon: <Github size={18} />, label: 'GitHub', href: 'https://github.com' },
    { icon: <Twitter size={18} />, label: 'Twitter', href: 'https://twitter.com' },
    { icon: <Discord size={18} />, label: 'Discord', href: '#' },
    { icon: <Telegram size={18} />, label: 'Telegram', href: '#' },
    { icon: <Globe size={18} />, label: 'Status', href: '#' },
  ];

  return (
    <>
      {/* 1. High-Contrast Red Noir Testimonial Banner with AnimatedText */}
      <div className="w-full bg-[#ef233c] py-14 px-6 mt-16 relative overflow-hidden shadow-2xl">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1.5 text-black mb-5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current text-black" />
            ))}
          </div>

          <AnimatedText
            text={'"DownZaro has completely transformed how we organize and archive media. What used to take complicated command-line setups now takes seconds."'}
            animationType="words"
            staggerDelay={0.03}
            duration={0.5}
            viewportAmount={0.7}
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-black font-manrope leading-tight mb-6 tracking-tight"
          />

          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-[#ef233c] w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-black font-extrabold text-sm sm:text-base font-manrope tracking-wider">
                FASTER DOWNLOADS • ZERO ADS • 100% PRIVATE
              </div>
              <div className="text-black/80 font-medium text-xs flex items-center gap-1.5">
                <PulsatingDots className="h-1.5 w-1.5 bg-black" />
                <span>High-Speed Cloud Muxing Engine Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Hover Footer with TextHoverEffect */}
      <footer className="bg-[#0F0F11]/60 border border-white/5 relative h-fit rounded-3xl overflow-hidden m-4 sm:m-8 backdrop-blur-xl shadow-2xl">
        <div className="max-w-7xl mx-auto p-8 sm:p-14 z-30 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 lg:gap-14">
            {/* Brand Section */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Logo size={32} showWordmark={true} showTagline={false} />
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Pioneering high-speed, privacy-first media downloads with modern stream muxing and zero tracking.
              </p>
              
              {/* Engine Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-zinc-800 text-xs text-zinc-300 w-fit">
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthInfo?.status === 'healthy' ? 'bg-[#ef233c] animate-pulse' : 'bg-[#ef233c] animate-pulse'
                  }`}
                />
                <span className="font-mono text-[11px] text-zinc-300">
                  yt-dlp {healthInfo?.ytdlp_version || '2026.08.19'} • FFmpeg 7.1
                </span>
              </div>
            </div>

            {/* Supported Formats */}
            <div>
              <h4 className="text-white text-base font-semibold mb-5 flex items-center gap-2 font-manrope">
                <Sparkles size={16} className="text-[#ef233c]" />
                Supported Formats
              </h4>
              <ul className="space-y-2.5">
                {formatLinks.map((link) => (
                  <li key={link.label} className="relative text-sm text-zinc-400">
                    <a
                      href={link.href}
                      className="hover:text-[#ef233c] transition-colors"
                    >
                      {link.label}
                    </a>
                    {link.pulse && (
                      <span className="inline-block ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-[#ef233c]/20 text-[#ef233c] rounded border border-[#ef233c]/40 uppercase tracking-widest animate-pulse">
                        Pro
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Trust Links */}
            <div>
              <h4 className="text-white text-base font-semibold mb-5 flex items-center gap-2 font-manrope">
                <ShieldCheck size={16} className="text-[#ef233c]" />
                Legal & Privacy
              </h4>
              <ul className="space-y-2.5 text-sm text-zinc-400">
                <li>
                  <button
                    onClick={() => onOpenLegal('terms')}
                    className="hover:text-[#ef233c] transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenLegal('privacy')}
                    className="hover:text-[#ef233c] transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenLegal('dmca')}
                    className="hover:text-[#ef233c] transition-colors cursor-pointer text-left"
                  >
                    DMCA & Copyright
                  </button>
                </li>
              </ul>
            </div>

            {/* Performance & Highlights */}
            <div>
              <h4 className="text-white text-base font-semibold mb-5 flex items-center gap-2 font-manrope">
                <Zap size={16} className="text-[#ef233c]" />
                Engine Specs
              </h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-center space-x-2">
                  <Radio size={15} className="text-[#ef233c] shrink-0" />
                  <span>Real-time Multi-stream Muxing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck size={15} className="text-[#ef233c] shrink-0" />
                  <span>Zero Logs & Zero Ads Guarantee</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Sparkles size={15} className="text-[#ef233c] shrink-0" />
                  <span>Cloud Accelerated Downloads</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Large Text Hover Section (Cleanly separated, No Overlap) */}
        <div className="w-full px-4 sm:px-8 py-2 relative flex justify-center items-center z-20 pointer-events-auto">
          <div className="w-full max-w-6xl h-28 sm:h-44 md:h-56 lg:h-64 flex items-center justify-center">
            <TextHoverEffect text="DOWNZARO" className="w-full h-full" />
          </div>
        </div>

        <hr className="border-t border-zinc-800/80 mx-8 sm:mx-14 relative z-30" />

        {/* Footer Bottom Bar (Socials + Copyright) */}
        <div className="max-w-7xl mx-auto px-8 sm:px-14 py-6 z-30 relative flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400 space-y-4 md:space-y-0">
          {/* Social Icons */}
          <div className="flex space-x-5 text-zinc-400">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="hover:text-[#ef233c] transition-colors p-1.5 rounded-lg hover:bg-white/5"
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-center md:text-left font-manrope text-[11px] tracking-wider uppercase text-zinc-500">
            &copy; {new Date().getFullYear()} DownZaro Media Intelligence. All rights reserved.
          </p>
        </div>

        <FooterBackgroundGradient />
      </footer>
    </>
  );
};
