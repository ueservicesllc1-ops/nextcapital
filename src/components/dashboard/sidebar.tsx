"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const investorLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/deposits", label: "Depósitos" },
  { href: "/dashboard/withdrawals", label: "Retiros" },
];

const adminLinks = [
  { href: "/admin", label: "Admin Overview" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/deposits", label: "Depósitos" },
  { href: "/admin/withdrawals", label: "Retiros" },
];

export function Sidebar({ admin }: { admin?: boolean }) {
  const pathname = usePathname();
  const links = admin ? adminLinks : investorLinks;

  return (
    <aside className="w-full border-b border-slate-800 bg-slate-950 p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <p className="text-lg font-semibold text-cyan-300">Next Capital</p>
      <nav className="mt-6 grid gap-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900",
                active && "bg-slate-900 text-cyan-300"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
