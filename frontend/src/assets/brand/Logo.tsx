import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  showWordmark = true,
  showTagline = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Circular Logo Emblem */}
      <div className="relative flex items-center justify-center shrink-0 group">
        {/* Ambient Red Glow Backdrop */}
        <div
          style={{ width: size, height: size }}
          className="absolute inset-0 bg-[#ef233c] rounded-full blur-md opacity-40 group-hover:opacity-75 transition-opacity animate-pulse"
        />
        <img
          src="/logo.png"
          alt="DownZaro Logo"
          style={{ width: size, height: size }}
          className="relative rounded-full object-cover shadow-xl border border-white/20 transform group-hover:scale-105 transition-transform duration-300 ring-2 ring-[#ef233c]/40"
        />
      </div>

      {/* Wordmark and Tagline */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center text-xl sm:text-2xl font-black font-manrope tracking-tight leading-none">
            <span className="text-white font-extrabold">Down</span>
            <span className="text-[#ef233c] font-black">Zaro</span>
          </div>
          {showTagline && (
            <span className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-zinc-400 mt-1 font-manrope">
              DOWNLOAD • PLAY • ANYTHING
            </span>
          )}
        </div>
      )}
    </div>
  );
};
