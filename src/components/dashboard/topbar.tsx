"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { formatCurrency } from "@/lib/utils";

export function Topbar({ balance }: { balance: number }) {
  const { appUser, logout } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400">Dashboard</p>
        <p className="text-lg font-semibold text-white">{appUser?.name ?? "Investor"}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
          <p className="text-xs text-slate-400">Balance actual</p>
          <p className="text-sm font-semibold text-emerald-400">{formatCurrency(balance)}</p>
        </div>
        <button
          onClick={() => logout()}
          className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
