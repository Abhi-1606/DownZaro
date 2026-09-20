import React from 'react';
import { Sparkles } from 'lucide-react';

interface MorphingCtaButtonProps {
  isLoading?: boolean;
  idleText?: string;
  activeText?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const MorphingCtaButton: React.FC<MorphingCtaButtonProps> = ({
  isLoading = false,
  idleText = 'Fetch Media',
  activeText = 'Analyzing...',
  onClick,
  disabled = false,
  className = '',
  type = 'submit',
}) => {
  const currentText = isLoading ? activeText : idleText;
  const letters = Array.from(currentText);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`group relative overflow-hidden rounded-full px-6 py-2.5 bg-[#ef233c] text-white font-manrope font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(239,35,60,0.4)] hover:shadow-[0_0_35px_rgba(239,35,60,0.7)] hover:bg-[#ff2a44] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 ${className}`}
    >
      {/* Animated Sheen Layer */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      {/* Star / Sparkle Icon */}
      <Sparkles
        className={`w-3.5 h-3.5 text-white shrink-0 transition-transform duration-500 ${
          isLoading ? 'animate-spin text-amber-300' : 'group-hover:rotate-45 group-hover:scale-125'
        }`}
      />

      {/* Letter-by-letter text swap */}
      <span className="relative flex items-center tracking-wider overflow-hidden">
        {letters.map((char, index) => (
          <span
            key={`${currentText}-${index}`}
            className="inline-block transition-transform duration-300 ease-out"
            style={{
              transitionDelay: `${index * 25}ms`,
              animation: 'letterPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
              animationDelay: `${index * 20}ms`,
              whiteSpace: char === ' ' ? 'pre' : 'normal',
            }}
          >
            {char}
          </span>
        ))}
      </span>

      <style>{`
        @keyframes letterPop {
          0% {
            opacity: 0;
            transform: translateY(6px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </button>
  );
};

export default MorphingCtaButton;
