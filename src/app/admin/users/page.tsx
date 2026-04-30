"use client";

import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { AppUser } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((doc) => doc.data() as AppUser));
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      {loading ? <p className="mt-3 text-sm text-slate-400">Cargando usuarios...</p> : null}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="border-t border-slate-800">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3 capitalize">{user.status}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link className="text-cyan-300 hover:text-cyan-100" href={`/admin/users/${user.uid}`}>
                    Ver perfil
                  </Link>
                  <button 
                    onClick={async () => {
                      if (!confirm(`¿Estás seguro de que deseas borrar al usuario ${user.email}? Esto no se puede deshacer.`)) return;
                      try {
                        const { doc, deleteDoc } = await import("firebase/firestore");
                        await deleteDoc(doc(db, "users", user.uid));
                        await deleteDoc(doc(db, "balances", user.uid));
                        setUsers(prev => prev.filter(u => u.uid !== user.uid));
                        alert("Usuario borrado correctamente.");
                      } catch (e: any) {
                        alert("Error al borrar el usuario: " + e.message);
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
