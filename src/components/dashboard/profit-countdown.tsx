"use client";

import { useEffect, useState } from "react";
import { Deposit } from "@/lib/types";
import { normalizeDate } from "@/lib/firestore-client";

interface ProfitCountdownProps {
  deposits: Deposit[];
}

export function ProfitCountdown({ deposits }: ProfitCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);
  const [targetTime, setTargetTime] = useState<Date | null>(null);

  useEffect(() => {
    // Buscar el primer depósito aprobado para tomar su hora de referencia
    const firstApproved = [...deposits]
      .filter((d) => d.status === "approved")
      .sort((a, b) => new Date(normalizeDate(a.createdAt)).getTime() - new Date(normalizeDate(b.createdAt)).getTime())[0];

    if (!firstApproved) {
      setTargetTime(null);
      return;
    }

    const depositDate = new Date(normalizeDate(firstApproved.createdAt));
    const targetH = depositDate.getHours();
    const targetM = depositDate.getMinutes();
    const targetS = depositDate.getSeconds();

    const updateTimer = () => {
      const now = new Date();
      let nextTarget = new Date(now);
      nextTarget.setHours(targetH, targetM, targetS, 0);

      // Si la hora ya pasó hoy, el próximo es mañana
      if (nextTarget.getTime() <= now.getTime()) {
        nextTarget.setDate(nextTarget.getDate() + 1);
      }

      setTargetTime(nextTarget);

      const diff = nextTarget.getTime() - now.getTime();
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({ h, m, s });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deposits]);

  if (!targetTime || !timeLeft) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-2xl backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Próximo Rendimiento</p>
        <p className="mt-2 text-sm text-zinc-400">Sin depósitos activos</p>
      </div>
    );
  }

  // Calcular progreso (0 a 100) basado en 24h
  const totalSeconds = 24 * 3600;
  const remainingSeconds = timeLeft.h * 3600 + timeLeft.m * 60 + timeLeft.s;
  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col items-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Próximo Rendimiento</p>
        
        <div className="relative mt-4 flex h-32 w-32 items-center justify-center">
          {/* Progress Circle SVG */}
          <svg className="h-full w-full -rotate-90 transform">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/[0.03]"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="url(#countdown-gradient)"
              strokeWidth="4"
              strokeDasharray={364.42}
              strokeDashoffset={364.42 - (364.42 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold tracking-tighter text-white">
              {String(timeLeft.h).padStart(2, "0")}:{String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">Restante</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[10px] text-zinc-500">Referencia de depósito: <span className="text-zinc-300">{targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
          <p className="mt-1 text-[10px] text-cyan-400/80 italic">Acreditación diaria estimada</p>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-cyan-500/5 blur-2xl" />
    </div>
  );
}
