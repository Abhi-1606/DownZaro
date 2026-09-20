import React, { useEffect, useRef } from 'react';

interface TubesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  enableClickInteraction?: boolean;
}

export const TubesBackground: React.FC<TubesBackgroundProps> = ({
  children,
  className = '',
  enableClickInteraction = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tubesRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    const initTubes = async () => {
      if (!canvasRef.current) return;

      try {
        // Dynamic import from threejs-components CDN
        // @ts-ignore
        const module = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
        const TubesCursor = module.default;

        if (!mounted || !canvasRef.current) return;

        const app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ['#ef233c', '#800020', '#ff2a44'],
            lights: {
              intensity: 180,
              colors: ['#ff4d6d', '#ef233c', '#d90429', '#2b0609'],
            },
          },
        });

        tubesRef.current = app;

        cleanup = () => {
          try {
            app.destroy?.();
          } catch {}
        };
      } catch (error) {
        // Graceful fallback to ambient canvas particles if CDN isn't reachable
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
        let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

        const handleResize = () => {
          if (!canvas) return;
          width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
          height = canvas.height = canvas.parentElement?.clientHeight || 600;
        };
        window.addEventListener('resize', handleResize);

        // Simple glowing ambient particles
        const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
        for (let i = 0; i < 24; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2 + 1,
            alpha: Math.random() * 0.3 + 0.1,
          });
        }

        const render = () => {
          ctx.clearRect(0, 0, width, height);
          particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = width;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = height;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(239, 35, 60, ${p.alpha})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ef233c';
            ctx.fill();
          });
          animationFrameId = requestAnimationFrame(render);
        };
        render();

        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(animationFrameId);
        };
      }
    };

    initTubes();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  const handleClick = () => {
    if (!enableClickInteraction || !tubesRef.current) return;
    try {
      const palette = [
        ['#ef233c', '#ff0055', '#ff4d6d'],
        ['#9b5de5', '#f15bb5', '#fee440'],
        ['#00f5d4', '#00bbf9', '#ef233c'],
      ];
      const randomSet = palette[Math.floor(Math.random() * palette.length)];
      tubesRef.current.tubes?.setColors(randomSet);
    } catch {}
  };

  return (
    <div
      onClick={handleClick}
      className={`relative w-full overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none opacity-40 mix-blend-screen"
        style={{ touchAction: 'none' }}
      />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};

export default TubesBackground;
