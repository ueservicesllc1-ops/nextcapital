"use client";
import { useState, useRef, useEffect } from "react";

import { TradingProvider, useTrading } from "@/components/trading/trading-context";
import { TradingSidebar } from "@/components/trading/trading-sidebar";
import { TradingChart } from "@/components/trading/trading-chart";
import { TradingPanel } from "@/components/trading/trading-panel";
import { TradingPositions } from "@/components/trading/trading-positions";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";

export default function TradingSimulatorPage() {
  return (
    <TradingProvider>
      <TradingLayout />
    </TradingProvider>
  );
}

function TradingLayout() {
  const { appUser, logout } = useAuth();
  const { tradingMode, setTradingMode, rechargeDemo } = useTrading();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main className="flex h-screen w-full flex-col bg-[#020203] text-zinc-300 font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-zinc-950 px-6 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            Volver
          </Link>

          <div className="h-6 w-px bg-white/10" />

          {/* MODO TOGGLE */}
          <div className="flex items-center gap-1 bg-black rounded-xl p-1 border border-white/10 shadow-inner">
            <button
              onClick={() => setTradingMode("demo")}
              className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                tradingMode === "demo"
                  ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${tradingMode === "demo" ? "bg-white animate-pulse" : "bg-zinc-700"}`} />
              Prueba
            </button>
            <button
              onClick={() => setTradingMode("real")}
              className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                tradingMode === "real"
                  ? "bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${tradingMode === "real" ? "bg-white animate-pulse" : "bg-zinc-700"}`} />
              Real
            </button>
          </div>

          {/* Botón Recargar Demo (Solo visible en Modo Prueba) */}
          {tradingMode === "demo" && (
            <button
              onClick={rechargeDemo}
              className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-cyan-400 transition-all active:scale-95"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Recargar $10k
            </button>
          )}
        </div>

        {/* USER MENU */}
        <div className="flex items-center gap-4 relative" ref={menuRef}>
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Inversionista</span>
            <span className="text-sm font-semibold text-white">{appUser?.name || "Invitado"}</span>
          </div>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center text-white font-bold text-sm border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors" />
            {appUser?.name?.[0] || "U"}
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-white/5 mb-1">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Cuenta</p>
                <p className="text-sm font-medium text-white truncate">{appUser?.email}</p>
              </div>
              
              <Link href="/trading/wallet" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Mi Billetera de Trading
              </Link>
              
              <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración
              </Link>

              <div className="h-px bg-white/5 my-1" />

              <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Assets */}
          <TradingSidebar />

          {/* Center - Chart & Positions */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <TradingChart />
            <TradingPositions />
          </div>

          {/* Right Panel - Order Execution */}
          <TradingPanel />
        </div>

        {/* Footer / Legal Disclaimer */}
        <footer className="flex items-center justify-center p-2 border-t border-white/[0.06] bg-black text-[10px] text-zinc-600 uppercase tracking-widest text-center">
          Simulador educativo. No se invierte dinero real. No somos broker ni asesor financiero. Los precios son simulados.
        </footer>
      </main>
  );
}
