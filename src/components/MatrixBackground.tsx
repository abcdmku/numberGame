import React, { useEffect, useRef, useCallback } from 'react';

interface Drop {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  targetOpacity: number;
  char: string;
  size: number;
  fadeSpeed: number;
  trail: { y: number; char: string; opacity: number }[];
  trailLength: number;
  nextCharDelay: number;
  charTimer: number;
}

const DIGITS = '0123456789';
const SYMBOLS = '+-×÷=<>≤≥≠∑∏√∞';
const CHARS = DIGITS + DIGITS + DIGITS + SYMBOLS; // weight towards digits

const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

export const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const initDrops = useCallback((width: number, height: number) => {
    const columnWidth = 28;
    const columns = Math.ceil(width / columnWidth);
    const drops: Drop[] = [];

    for (let i = 0; i < columns; i++) {
      // Only ~40% of columns are active — keeps it sparse
      if (Math.random() > 0.4) continue;

      const speed = 0.3 + Math.random() * 0.8;
      const trailLength = 3 + Math.floor(Math.random() * 6);

      drops.push({
        x: i * columnWidth + columnWidth / 2,
        y: Math.random() * height * -1, // start above viewport
        speed,
        opacity: 0,
        targetOpacity: 0.08 + Math.random() * 0.18, // very subtle: 0.08–0.26
        char: randomChar(),
        size: 11 + Math.floor(Math.random() * 4),
        fadeSpeed: 0.005 + Math.random() * 0.01,
        trail: [],
        trailLength,
        nextCharDelay: 60 + Math.random() * 120,
        charTimer: 0,
      });
    }

    return drops;
  }, []);

  const resetDrop = useCallback((drop: Drop, height: number) => {
    drop.y = -20 - Math.random() * 200;
    drop.speed = 0.3 + Math.random() * 0.8;
    drop.opacity = 0;
    drop.targetOpacity = 0.08 + Math.random() * 0.18;
    drop.char = randomChar();
    drop.trail = [];
    drop.trailLength = 3 + Math.floor(Math.random() * 6);
    drop.nextCharDelay = 60 + Math.random() * 120;
    drop.charTimer = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      dropsRef.current = initDrops(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      for (const drop of dropsRef.current) {
        // Move
        drop.y += drop.speed * (delta * 0.06);
        drop.charTimer += delta;

        // Fade in
        if (drop.opacity < drop.targetOpacity) {
          drop.opacity = Math.min(drop.opacity + drop.fadeSpeed * (delta * 0.06), drop.targetOpacity);
        }

        // Cycle character
        if (drop.charTimer >= drop.nextCharDelay) {
          // Push current position to trail
          drop.trail.push({
            y: drop.y,
            char: drop.char,
            opacity: drop.opacity * 0.7,
          });

          // Trim trail
          if (drop.trail.length > drop.trailLength) {
            drop.trail.shift();
          }

          drop.char = randomChar();
          drop.charTimer = 0;
        }

        // Draw trail
        for (let i = 0; i < drop.trail.length; i++) {
          const t = drop.trail[i];
          const trailProgress = i / drop.trail.length;
          const trailOpacity = t.opacity * trailProgress * 0.5;

          if (trailOpacity < 0.01) continue;

          ctx.font = `${drop.size - 1}px "SF Mono", "Cascadia Code", "JetBrains Mono", "Fira Code", monospace`;
          ctx.fillStyle = `rgba(52, 211, 153, ${trailOpacity})`; // emerald-400
          ctx.textAlign = 'center';
          ctx.fillText(t.char, drop.x, t.y);
        }

        // Draw lead character with glow
        if (drop.opacity > 0.01) {
          const glowOpacity = drop.opacity * 0.4;
          ctx.shadowColor = `rgba(16, 185, 129, ${glowOpacity})`; // emerald-500
          ctx.shadowBlur = 12;

          ctx.font = `${drop.size}px "SF Mono", "Cascadia Code", "JetBrains Mono", "Fira Code", monospace`;
          ctx.fillStyle = `rgba(167, 243, 208, ${drop.opacity})`; // emerald-200 for lead char
          ctx.textAlign = 'center';
          ctx.fillText(drop.char, drop.x, drop.y);

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        // Reset when fully below viewport
        if (drop.y > height + 100) {
          resetDrop(drop, height);
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initDrops, resetDrop]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.6 }}
      aria-hidden="true"
    />
  );
};
