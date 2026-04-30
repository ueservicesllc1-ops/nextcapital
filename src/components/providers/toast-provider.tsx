"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ showToast: (message: string, type?: ToastType) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 grid gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl px-4 py-3 text-sm shadow-lg ${
              item.type === "success"
                ? "bg-emerald-500 text-slate-950"
                : item.type === "error"
                ? "bg-rose-500 text-white"
                : "bg-cyan-500 text-slate-950"
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
