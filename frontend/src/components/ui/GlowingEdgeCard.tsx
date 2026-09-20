import React, { useEffect, useRef, useState } from 'react';

export interface GlowingEdgeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: 'dark' | 'light';
  children?: React.ReactNode;
  className?: string;
}

export const GlowingEdgeCard: React.FC<GlowingEdgeCardProps> = ({
  mode = 'dark',
  className = '',
  children,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const round = (value: number, precision = 3) => parseFloat(value.toFixed(precision));
  const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

  const centerOfElement = (rect: DOMRect) => [rect.width / 2, rect.height / 2];

  const getPointerPosition = (rect: DOMRect, e: React.MouseEvent<HTMLDivElement>) => {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = clamp((100 / rect.width) * x);
    const py = clamp((100 / rect.height) * y);
    return { pixels: [x, y], percent: [px, py] };
  };

  const angleFromPointer = (dx: number, dy: number) => {
    let angleDegrees = 0;
    if (dx !== 0 || dy !== 0) {
      const angleRadians = Math.atan2(dy, dx);
      angleDegrees = angleRadians * (180 / Math.PI) + 90;
      if (angleDegrees < 0) {
        angleDegrees += 360;
      }
    }
    return angleDegrees;
  };

  const closenessToEdge = (rect: DOMRect, x: number, y: number) => {
    const [cx, cy] = centerOfElement(rect);
    const dx = x - cx;
    const dy = y - cy;
    let k_x = Infinity;
    let k_y = Infinity;
    if (dx !== 0) k_x = cx / Math.abs(dx);
    if (dy !== 0) k_y = cy / Math.abs(dy);
    return clamp(1 / Math.min(k_x, k_y), 0, 1);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const position = getPointerPosition(rect, e);
    const [px, py] = position.pixels;
    const [perx, pery] = position.percent;

    const [cx, cy] = centerOfElement(rect);
    const dx = px - cx;
    const dy = py - cy;

    const edge = closenessToEdge(rect, px, py);
    const angle = angleFromPointer(dx, dy);

    cardRef.current.style.setProperty('--pointer-x', `${round(perx)}%`);
    cardRef.current.style.setProperty('--pointer-y', `${round(pery)}%`);
    cardRef.current.style.setProperty('--pointer-deg', `${round(angle)}deg`);
    cardRef.current.style.setProperty('--pointer-d', `${round(edge * 100)}`);

    if (isAnimating) {
      setIsAnimating(false);
      cardRef.current.classList.remove('animating');
    }
  };

  // Intro sweep animation
  useEffect(() => {
    const playAnimation = () => {
      if (!cardRef.current) return;

      setIsAnimating(true);
      cardRef.current.classList.add('animating');
      const angleStart = 110;
      const angleEnd = 465;

      cardRef.current.style.setProperty('--pointer-deg', `${angleStart}deg`);
      const startTime = performance.now();

      const animate = (now: number) => {
        if (!cardRef.current || !cardRef.current.classList.contains('animating')) return;

        const elapsed = now - startTime;

        if (elapsed > 300 && elapsed < 800) {
          const t = (elapsed - 300) / 500;
          const ease = 1 - Math.pow(1 - t, 3);
          cardRef.current.style.setProperty('--pointer-d', `${ease * 100}`);
        }

        if (elapsed > 300 && elapsed < 1800) {
          const t = (elapsed - 300) / 1500;
          const ease = t * t * t;
          const d = (angleEnd - angleStart) * (ease * 0.5) + angleStart;
          cardRef.current.style.setProperty('--pointer-deg', `${d}deg`);
        }

        if (elapsed >= 1800 && elapsed < 3500) {
          const t = (elapsed - 1800) / 1700;
          const ease = 1 - Math.pow(1 - t, 3);
          const d = (angleEnd - angleStart) * (0.5 + ease * 0.5) + angleStart;
          cardRef.current.style.setProperty('--pointer-deg', `${d}deg`);
        }

        if (elapsed > 2500 && elapsed < 3800) {
          const t = (elapsed - 2500) / 1300;
          const ease = t * t * t;
          cardRef.current.style.setProperty('--pointer-d', `${(1 - ease) * 100}`);
        }

        if (elapsed < 3800) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          cardRef.current?.classList.remove('animating');
        }
      };

      requestAnimationFrame(animate);
    };

    const timer = setTimeout(playAnimation, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`relative w-full rounded-[24px] flex flex-col group transition-colors duration-300 ${
        isAnimating ? 'animating' : ''
      } ${className}`}
      style={
        {
          '--glow-sens': '30',
          '--pointer-x': '50%',
          '--pointer-y': '50%',
          '--pointer-deg': '45deg',
          '--pointer-d': '0',
          '--color-sens': 'calc(var(--glow-sens) + 20)',
          '--card-bg':
            'linear-gradient(135deg, #130406 0%, #080808 100%)',
          '--blend': 'screen',
          '--glow-blend': 'plus-lighter',
          '--glow-color': '350deg 85% 65%',
          '--glow-boost': '20%',
          '--fg': 'white',
        } as React.CSSProperties
      }
      {...props}
    >
      <style>{`
        .glowing-card-mesh-border {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          z-index: 1;
          border: 1px solid transparent;
          background:
            linear-gradient(var(--card-bg) 0 100%) padding-box,
            radial-gradient(at 80% 55%, hsla(350,100%,65%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 69% 34%, hsla(12,100%,65%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 8% 6%, hsla(280,100%,70%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 41% 38%, hsla(355,100%,60%,1) 0px, transparent 50%) border-box,
            linear-gradient(#ef233c 0 100%) border-box;
          opacity: calc((var(--pointer-d) - var(--color-sens)) / (100 - var(--color-sens)));
          mask-image: conic-gradient(from var(--pointer-deg) at center, black 25%, transparent 40%, transparent 60%, black 75%);
          transition: opacity 0.25s ease-out;
          pointer-events: none;
        }

        .glowing-card-glow {
          position: absolute;
          inset: -30px;
          pointer-events: none;
          z-index: 2;
          mask-image: conic-gradient(from var(--pointer-deg) at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%);
          opacity: calc((var(--pointer-d) - var(--glow-sens)) / (100 - var(--glow-sens)));
          mix-blend-mode: var(--glow-blend);
          transition: opacity 0.25s ease-out;
          border-radius: inherit;
        }

        .glowing-card-glow::before {
          content: "";
          position: absolute;
          inset: 30px;
          border-radius: inherit;
          box-shadow:
            inset 0 0 0 1px hsl(var(--glow-color) / 100%),
            inset 0 0 15px 0 hsl(var(--glow-color) / calc(var(--glow-boost) + 30%)),
            0 0 15px 0 hsl(var(--glow-color) / calc(var(--glow-boost) + 30%)),
            0 0 35px 2px hsl(var(--glow-color) / calc(var(--glow-boost) + 15%));
        }

        .group:not(:hover):not(.animating) .glowing-card-mesh-border,
        .group:not(:hover):not(.animating) .glowing-card-glow {
          opacity: 0 !important;
          transition: opacity 0.6s ease-in-out;
        }
      `}</style>

      {/* Background Layers */}
      <div className="glowing-card-mesh-border" />
      <div className="glowing-card-glow" />

      {/* Content Container */}
      <div className="relative z-10 w-full h-full overflow-hidden bg-[var(--card-bg)] rounded-[inherit] border border-white/10 shadow-2xl backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
};

export default GlowingEdgeCard;
