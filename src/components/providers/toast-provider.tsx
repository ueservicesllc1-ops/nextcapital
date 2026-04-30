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
    
    // Auto-dismiss successes and info, but let errors stay until dismissed
    if (type !== "error") {
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 3500);
    }
  }, []);

  const dismissToast = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {items.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="grid w-full max-w-sm gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200"
              >
                <div className={`absolute left-0 top-0 h-1 w-full ${
                  item.type === "success" ? "bg-emerald-500" : item.type === "error" ? "bg-rose-500" : "bg-cyan-500"
                }`} />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 shrink-0 rounded-full p-2 ${
                      item.type === "success" ? "bg-emerald-500/10 text-emerald-500" : 
                      item.type === "error" ? "bg-rose-500/10 text-rose-500" : 
                      "bg-cyan-500/10 text-cyan-500"
                    }`}>
                      {item.type === "success" ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : item.type === "error" ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      ) : (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div className="grid gap-1">
                      <h3 className="font-semibold text-white">
                        {item.type === "success" ? "¡Éxito!" : item.type === "error" ? "Aviso importante" : "Información"}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => dismissToast(item.id)}
                      className={`rounded-xl px-5 py-2 text-sm font-medium transition-colors ${
                        item.type === "success" ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : 
                        item.type === "error" ? "bg-rose-500 text-white hover:bg-rose-400" : 
                        "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      }`}
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
