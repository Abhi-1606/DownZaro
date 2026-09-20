import React, { useEffect, useState } from 'react';
import { Sparkles, X, Zap, UserCheck } from 'lucide-react';

export interface WelcomeBannerData {
  name: string;
  username: string;
  action: 'signin' | 'signup';
}

interface WelcomeBannerProps {
  data: WelcomeBannerData | null;
  onDismiss: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ data, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  const firstName = data ? data.name.split(' ')[0] || data.name : '';
  const messages = data
    ? data.action === 'signup'
      ? [
          `Welcome to DownZaro!`,
          `Hi ${firstName}!`,
          `@${data.username} is Ready`,
          `Unlimited Downloads Active ⚡`,
        ]
      : [
          `Welcome Back, ${firstName}!`,
          `Hi @${data.username}!`,
          `Unlimited Stream Active ⚡`,
          `4K & 320k Lossless Unlocked`,
        ]
    : [];

  useEffect(() => {
    if (data) {
      setVisible(true);
      setTextIndex(0);

      // Cycle through messages cleanly every 1.4s
      const interval = setInterval(() => {
        setTextIndex((prev) => (prev + 1) % messages.length);
      }, 1400);

      // Dismiss banner after 6 seconds
      const dismissTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 400);
      }, 6000);

      return () => {
        clearInterval(interval);
        clearTimeout(dismissTimer);
      };
    } else {
      setVisible(false);
    }
  }, [data, onDismiss, messages.length]);

  if (!data) return null;

  return (
    <div
      className={`fixed top-20 right-4 sm:right-6 z-50 w-80 sm:w-96 transition-all duration-500 ease-out transform ${
        visible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : 'opacity-0 translate-x-12 scale-95 pointer-events-none'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950/95 border border-[#ef233c]/50 shadow-[0_10px_35px_rgba(239,35,60,0.3)] backdrop-blur-2xl p-4 text-left font-inter">
        {/* Glow backdrop on right edge */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ef233c]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ef233c]/15 border border-[#ef233c]/30 text-[10px] font-bold text-red-200 uppercase tracking-widest font-manrope">
            <Sparkles className="w-3 h-3 text-[#ef233c]" />
            <span>{data.action === 'signup' ? 'Account Created' : 'Authenticated'}</span>
          </div>

          <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Zap className="w-2.5 h-2.5 text-emerald-400" />
            <span>Unlimited Access</span>
          </div>

          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Crisp, Non-Overlapping Animated Message Box */}
        <div className="h-10 flex items-center overflow-hidden">
          <div
            key={textIndex}
            className="w-full text-base sm:text-lg font-bold font-manrope text-white tracking-tight truncate animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <span className="text-[#ef233c] font-black mr-1">✦</span>
            {messages[textIndex]}
          </div>
        </div>

        {/* Bottom Subtext */}
        <div className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
          <div className="flex items-center gap-1.5 truncate">
            <UserCheck className="w-3 h-3 text-zinc-500" />
            <span className="truncate">Signed in as <strong className="text-zinc-200">@{data.username}</strong></span>
          </div>
          <span className="text-emerald-400 font-medium">Zero Ads</span>
        </div>

        {/* Animated Progress line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ef233c] to-transparent animate-pulse" />
      </div>
    </div>
  );
};

export default WelcomeBanner;
