import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import {
  Bot,
  Music,
  Zap,
  Layers,
  ShieldCheck,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';

export interface BentoCardData {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  description: string;
  tag?: string;
  colSpan?: string;
  rowSpan?: string;
}

export interface MagicBentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}

const DEFAULT_PARTICLE_COUNT = 10;
const DEFAULT_SPOTLIGHT_RADIUS = 280;
const DEFAULT_GLOW_COLOR = '239, 35, 60'; // DownZaro Crimson
const MOBILE_BREAKPOINT = 768;

const DOWNZARO_CARDS: BentoCardData[] = [
  {
    icon: Bot,
    label: 'Lossless Pipeline',
    title: 'Automated Muxing & M4S Engine',
    description:
      'High-resolution 4K and 1080p YouTube videos separate video and audio channels. DownZaro’s background ffmpeg pipeline automatically muxes streams into universal MP4 with zero quality degradation.',
    tag: 'FFmpeg Core',
    colSpan: 'lg:col-span-2',
    rowSpan: 'lg:row-span-2',
  },
  {
    icon: Music,
    label: 'Audio Mastery',
    title: 'Studio 320 kbps MP3 Extraction',
    description:
      'Extract pristine high-bitrate MP3 and M4A audio tracks with clean metadata and embedded HD cover art, ready for offline playback and DJ software.',
    tag: 'Lossless Audio',
    colSpan: 'lg:col-span-2',
  },
  {
    icon: Zap,
    label: 'Performance',
    title: 'Zero Ads & Direct Concurrency',
    description:
      'No popups, redirect traps, or wait timers. Pure, raw server-side streaming directly down to your local storage.',
    tag: 'Blazing Speed',
  },
  {
    icon: Layers,
    label: 'Bundles',
    title: 'All-in-One Media Package',
    description:
      'Download the 4K video, 320k audio, and original HD thumbnail bundled together in a clean ZIP archive with one click.',
    tag: 'ZIP Archive',
  },
  {
    icon: ShieldCheck,
    label: 'Privacy First',
    title: 'In-Memory Stream Security',
    description:
      'Temporary files are isolated in memory and purged automatically. No IP tracking, accounts, or persistent logs kept.',
    tag: 'Zero Trace',
  },
  {
    icon: Cpu,
    label: 'Universal Support',
    title: '1,000+ Online Media Portals',
    description:
      'YouTube, Instagram, TikTok, X, Reddit, Vimeo, SoundCloud, Twitch, and direct MP4/M3U8 streams supported natively.',
    tag: 'Omnichannel',
  },
];

const createParticleElement = (x: number, y: number, color: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'bento-particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 0.9);
    box-shadow: 0 0 8px rgba(${color}, 0.8);
    pointer-events: none;
    z-index: 50;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const ParticleCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}> = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = true,
  enableMagnetism = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const isHoveredRef = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();
    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        },
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const timeoutId = window.setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const x = Math.random() * width;
        const y = Math.random() * height;
        const particle = createParticleElement(x, y, glowColor);
        cardRef.current.appendChild(particle);
        particlesRef.current.push(particle);

        gsap.fromTo(
          particle,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );

        gsap.to(particle, {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        });
      }, i * 90);
      timeoutsRef.current.push(timeoutId);
    }
  }, [particleCount, glowColor]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      gsap.to(element, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        gsap.to(element, { rotateX, rotateY, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.04;
        const magnetY = (y - centerY) * 0.04;
        magnetismAnimationRef.current = gsap.to(element, { x: magnetX, y: magnetY, duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: rgba(${glowColor}, 0.5);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        z-index: 100;
      `;
      element.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        { scale: 40, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => ripple.remove() }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return (
    <div ref={cardRef} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
  );
};

export const MagicBento: React.FC<MagicBentoProps> = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = true,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldDisableAnimations = disableAnimations || isMobile;

  useEffect(() => {
    if (!enableSpotlight || shouldDisableAnimations) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll('.magic-bento-card');

      cards.forEach((card) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
        (card as HTMLElement).style.setProperty('--spotlight-radius', `${spotlightRadius}px`);
        (card as HTMLElement).style.setProperty('--glow-color', `rgba(${glowColor}, 0.2)`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableSpotlight, shouldDisableAnimations, spotlightRadius, glowColor]);

  return (
    <div className="w-full">
      <style>{`
        .magic-bento-card {
          background: linear-gradient(145deg, #0e0404 0%, #050505 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }

        .magic-bento-card:hover {
          border-color: rgba(${glowColor}, 0.4);
        }

        .spotlight-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            var(--spotlight-radius) circle at var(--mouse-x) var(--mouse-y),
            var(--glow-color),
            transparent 80%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .magic-bento-card:hover .spotlight-overlay {
          opacity: 1;
        }

        .border-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          padding: 1px;
          background: radial-gradient(
            var(--spotlight-radius) circle at var(--mouse-x) var(--mouse-y),
            rgba(${glowColor}, 0.9),
            transparent 45%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .magic-bento-card:hover .border-glow {
          opacity: 1;
        }
      `}</style>

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DOWNZARO_CARDS.map((card, index) => {
          const Icon = card.icon;
          const isLarge = index === 0;

          const CardContent = (
            <div className="h-full w-full p-8 flex flex-col justify-between group select-none">
              <div className="spotlight-overlay" />
              {enableBorderGlow && <div className="border-glow" />}

              {/* Top Header */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ef233c] group-hover:scale-110 group-hover:bg-[#ef233c]/10 group-hover:border-[#ef233c]/30 transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  {card.tag && (
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 group-hover:text-[#ef233c] group-hover:border-[#ef233c]/30 transition-colors">
                      {card.tag}
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono font-semibold tracking-wider text-[#ef233c] uppercase">
                  {card.label}
                </span>
                <h3 className={`${isLarge ? 'text-2xl sm:text-3xl' : 'text-xl'} font-bold text-white font-manrope mt-2 tracking-tight`}>
                  {card.title}
                </h3>
              </div>

              {/* Bottom Body */}
              <div className="relative z-10 mt-6 flex flex-col justify-end">
                <p className={`text-sm text-zinc-400 leading-relaxed font-inter font-light ${textAutoHide && !isLarge ? 'line-clamp-3' : ''}`}>
                  {card.description}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-500 group-hover:text-white transition-colors">
                  <span className="font-manrope">Explore Architecture</span>
                  <ArrowUpRight className="w-4 h-4 text-[#ef233c] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );

          if (enableStars) {
            return (
              <ParticleCard
                key={index}
                className={`magic-bento-card ${card.colSpan || ''} ${card.rowSpan || ''}`}
                particleCount={isLarge ? 16 : particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                enableMagnetism={enableMagnetism}
                clickEffect={clickEffect}
                disableAnimations={shouldDisableAnimations}
              >
                {CardContent}
              </ParticleCard>
            );
          }

          return (
            <div
              key={index}
              className={`magic-bento-card ${card.colSpan || ''} ${card.rowSpan || ''}`}
            >
              {CardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MagicBento;
