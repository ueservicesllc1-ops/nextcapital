"use client";

import Link from "next/link";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { AppUser } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface UserWithBalance extends AppUser {
  currentBalance: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "users"));
      const rawUsers = snap.docs.map((d) => d.data() as AppUser);

      // Fetch balances in parallel
      const withBalances = await Promise.all(
        rawUsers.map(async (user) => {
          try {
            const balanceSnap = await getDoc(doc(db, "balances", user.uid));
            const currentBalance = balanceSnap.data()?.currentBalance ?? 0;
            return { ...user, currentBalance };
          } catch {
            return { ...user, currentBalance: 0 };
          }
        })
      );

      setUsers(withBalances);
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <main className="min-h-screen bg-[#020203] p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Usuarios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {loading ? "Cargando..." : `${users.length} inversores registrados`}
        </p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-zinc-500 text-sm">Cargando usuarios...</div>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Nombre</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Rol</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Estado</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Balance</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {users.map((user) => (
                  <tr key={user.uid} className="transition-colors hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-zinc-200">{user.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-400">{user.email}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                        user.role === "admin"
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-white/[0.04] text-zinc-400"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                        user.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-500/10 text-zinc-500"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-white">
                      {formatCurrency(user.currentBalance)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
                          href={`/admin/users/${user.uid}`}
                        >
                          Ver perfil
                        </Link>
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Estás seguro de que deseas borrar al usuario ${user.email}? Esto no se puede deshacer.`)) return;
                            try {
                              const { doc: firestoreDoc, deleteDoc } = await import("firebase/firestore");
                              await deleteDoc(firestoreDoc(db, "users", user.uid));
                              await deleteDoc(firestoreDoc(db, "balances", user.uid));
                              setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
                            } catch (e: unknown) {
                              alert("Error al borrar el usuario: " + (e instanceof Error ? e.message : "Error desconocido"));
                            }
                          }}
                          className="text-xs font-medium text-rose-500 hover:text-rose-400 hover:underline"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
