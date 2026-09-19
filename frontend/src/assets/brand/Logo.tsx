import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 36,
  showWordmark = true,
  showTagline = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Red Noir Diamond Logo Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        <div
          style={{ width: size, height: size }}
          className="relative flex items-center justify-center"
        >
          {/* Ambient Red Glow */}
          <div className="absolute inset-0 bg-[#ef233c] rounded-md rotate-45 blur-sm opacity-60 animate-pulse" />
          
          {/* Rotated Diamond Plate */}
          <div className="relative w-full h-full bg-gradient-to-br from-[#ef233c] to-[#990012] rounded-md rotate-45 flex items-center justify-center shadow-lg border border-white/20">
            {/* Center Down Arrow Icon */}
            <svg
              className="-rotate-45 w-1/2 h-1/2 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4v12" />
              <path d="m6 11 6 6 6-6" />
              <path d="M4 20h16" />
            </svg>
          </div>
        </div>
      </div>

      {/* Wordmark and Tagline */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center text-xl sm:text-2xl font-black font-manrope tracking-tight leading-none">
            <span className="text-white font-extrabold">Down</span>
            <span className="text-[#ef233c] font-black">Zaro</span>
          </div>
          {showTagline && (
            <span className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-zinc-500 mt-1 font-manrope">
              LINK IT • DOWNLOAD IT • KEEP IT
            </span>
          )}
        </div>
      )}
    </div>
  );
};
