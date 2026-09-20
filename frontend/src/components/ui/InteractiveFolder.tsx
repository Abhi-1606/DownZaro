/**
 * InteractiveFolder Component
 * A premium, interactive folder UI element that opens on click
 * to reveal contents with a "drifting" animation effect.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface FolderProps {
  /** Main color of the folder */
  color?: string;
  /** Scale factor for the folder */
  size?: number;
  /** Array of React elements to display as "papers" inside the folder */
  items?: React.ReactNode[];
  /** Optional CSS class for the wrapper */
  className?: string;
  /** Title or label to display on the folder */
  label?: string;
}

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export function InteractiveFolder({
  color = '#ef233c',
  size = 1,
  items = [],
  className = '',
  label,
}: FolderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const maxVisibleItems = 3;
  const displayItems = items.slice(0, maxVisibleItems);
  while (displayItems.length < maxVisibleItems) {
    displayItems.push(null);
  }

  const folderBackColor = darkenColor(color, 0.2);
  const paperColors = [
    '#1c1917',
    '#262626',
    '#0f0f10',
  ];

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    if (!isOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.25;
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.25;
    setMousePos({ x, y });
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setHoveredIndex(null);
  };

  const getPaperTransform = (index: number) => {
    if (!isOpen) return { x: '-50%', y: '10%', rotate: 0, scale: 0.9 };

    const baseTransforms = [
      { x: '-120%', y: '-75%', rotate: -15 },
      { x: '20%', y: '-75%', rotate: 15 },
      { x: '-50%', y: '-110%', rotate: 4 },
    ];

    const base = baseTransforms[index] || { x: '-50%', y: '-50%', rotate: 0 };

    if (hoveredIndex === index) {
      return {
        x: `calc(${base.x} + ${mousePos.x}px)`,
        y: `calc(${base.y} + ${mousePos.y}px)`,
        rotate: base.rotate,
        scale: 1.15,
      };
    }

    return { ...base, scale: 1 };
  };

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ transform: `scale(${size})`, width: 130, height: 110 }}
    >
      <div
        className="relative cursor-pointer group select-none"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to open/close folder"
      >
        {/* Folder Back */}
        <div
          className="relative w-[115px] h-[88px] transition-all duration-500 rounded-tr-[14px] rounded-br-[14px] rounded-bl-[14px] border border-white/10"
          style={{
            backgroundColor: folderBackColor,
            boxShadow: isOpen
              ? `0 15px 35px -5px rgba(239, 35, 60, 0.35)`
              : '0 6px 16px -2px rgba(0,0,0,0.5)',
          }}
        >
          {/* Tab */}
          <div
            className="absolute bottom-full left-0 w-[38px] h-[14px] rounded-t-[8px] border-t border-l border-white/10"
            style={{ backgroundColor: folderBackColor }}
          />

          {/* Papers / Drifting Items */}
          {displayItems.map((item, i) => (
            <motion.div
              key={i}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={handleMouseLeave}
              animate={getPaperTransform(i)}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                mass: 1,
              }}
              className="absolute left-1/2 flex items-center justify-center overflow-hidden p-2"
              style={{
                zIndex: 20 + i,
                backgroundColor: paperColors[i],
                borderRadius: '10px',
                width: i === 0 ? '80px' : i === 1 ? '90px' : '100px',
                height: i === 0 ? '70px' : i === 1 ? '75px' : '80px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {item || (
                <div className="w-full h-full p-2 flex flex-col gap-1.5 opacity-30 text-white">
                  <div className="w-3/4 h-1.5 bg-current rounded-full" />
                  <div className="w-1/2 h-1.5 bg-current rounded-full" />
                  <div className="w-2/3 h-1.5 bg-current rounded-full" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Folder Front Flap - Left Side */}
          <motion.div
            animate={{
              skewX: isOpen ? 16 : 0,
              scaleY: isOpen ? 0.58 : 1,
              translateY: isOpen ? 5 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute inset-0 z-30 origin-bottom"
            style={{
              backgroundColor: color,
              borderRadius: '6px 14px 14px 14px',
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          />

          {/* Folder Front Flap - Right Side */}
          <motion.div
            animate={{
              skewX: isOpen ? -16 : 0,
              scaleY: isOpen ? 0.58 : 1,
              translateY: isOpen ? 5 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute inset-0 z-30 origin-bottom"
            style={{
              backgroundColor: color,
              borderRadius: '6px 14px 14px 14px',
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          />

          {/* Full-width Folder Label (Unclipped) */}
          {label && (
            <motion.div
              animate={{
                opacity: isOpen ? 0 : 1,
                scale: isOpen ? 0.85 : 1,
                translateY: isOpen ? 8 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none px-2"
            >
              <span className="text-white font-manrope text-[11px] font-bold tracking-wider whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {label}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InteractiveFolder;
