'use client';
import React, { useState } from 'react';

interface LetterHoverEffectProps {
  text?: string;
  className?: string;
  letterClassName?: string;
}

export default function LetterHoverEffect({
  text = "Hover Me",
  className = "",
  letterClassName = "",
}: LetterHoverEffectProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const getLetterStyle = (index: number): React.CSSProperties => {
    const isHovered = hoveredIndex === index;
    const distance = hoveredIndex >= 0 ? Math.abs(index - hoveredIndex) : 0;

    let scale = 1;
    let translateY = 0;
    let rotateX = 0;
    let brightness = 1;

    if (hoveredIndex >= 0) {
      if (isHovered) {
        scale = 1.35;
        translateY = -12;
        rotateX = -12;
        brightness = 1.25;
      } else if (distance === 1) {
        scale = 1.18;
        translateY = -6;
        rotateX = -6;
        brightness = 1.12;
      } else if (distance === 2) {
        scale = 1.08;
        translateY = -3;
        rotateX = -3;
        brightness = 1.05;
      }
    }

    return {
      transform: `perspective(1000px) translateY(${translateY}px) rotateX(${rotateX}deg) scale(${scale}) translateZ(${
        isHovered ? 30 : distance <= 2 ? 15 : 0
      }px)`,
      filter: `brightness(${brightness})`,
      transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      zIndex: isHovered ? 10 : distance <= 2 ? 5 : 1,
      display: 'inline-block',
      willChange: 'transform, filter',
    };
  };

  return (
    <div className={`select-none flex flex-wrap justify-center items-center ${className}`}>
      <span className="inline-flex flex-wrap justify-center">
        {text.split('').map((letter, index) => (
          <span
            key={index}
            className={`cursor-pointer relative transition-transform ${letterClassName}`}
            style={getLetterStyle(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </span>
    </div>
  );
}
