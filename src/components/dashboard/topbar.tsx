"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { db } from "@/lib/firebase/client";
import { formatCurrency } from "@/lib/utils";

export function Topbar({ balance: balanceProp }: { balance?: number }) {
  const { appUser, firebaseUser, logout } = useAuth();
  const [balance, setBalance] = useState(balanceProp ?? 0);

  useEffect(() => {
    // Si se pasa un valor externo, úsalo directamente
    if (balanceProp !== undefined) {
      setBalance(balanceProp);
      return;
    }
    // Si no, cargarlo desde Firestore
    if (!firebaseUser) return;
    let cancelled = false;
    getDoc(doc(db, "balances", firebaseUser.uid))
      .then((snap) => {
        if (!cancelled && snap.exists()) {
          setBalance(snap.data().currentBalance ?? 0);
        }
      })
      .catch(() => { /* silencioso */ });
    return () => { cancelled = true; };
  }, [balanceProp, firebaseUser]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020203]/80 px-8 py-4 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20">
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Dashboard</p>
              <p className="text-base font-medium text-zinc-100">{appUser?.name ?? "Investor"}</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Capital Activo</p>
              <p className="text-sm font-bold text-cyan-400">{formatCurrency(balance)}</p>
            </div>
          </div>
          <div className="h-6 w-px bg-white/[0.06]" />
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
