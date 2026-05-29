'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  char: string;
  life: number;
  maxLife: number;
}

const HEX_CHARS = '0123456789ABCDEF';
const SYMBOLS = ['₿', '⛏', '#', '0x', '∞'];

function randomChar() {
  if (Math.random() < 0.15) return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  return HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
}

export default function MiningParticles({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawnParticle() {
      if (!canvas) return;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const maxLife = 80 + Math.random() * 120;
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.3 - Math.random() * 0.5,
        alpha: 0,
        size: 9 + Math.random() * 5,
        char: randomChar(),
        life: 0,
        maxLife,
      });
    }

    let frame = 0;
    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn
      if (active && frame % 4 === 0 && particlesRef.current.length < 60) {
        spawnParticle();
      }
      frame++;

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        // Fade in then out
        p.alpha = progress < 0.2
          ? progress / 0.2
          : progress > 0.8
          ? (1 - progress) / 0.2
          : 1;

        ctx.save();
        ctx.globalAlpha = p.alpha * (active ? 0.18 : 0.05);
        ctx.fillStyle = '#f59e0b';
        ctx.font = `${p.size}px "Courier New", monospace`;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
}
