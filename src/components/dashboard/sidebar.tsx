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
    <aside className="w-full border-b border-white/[0.06] bg-[#020203] p-6 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        {admin ? "Panel Admin" : "Mi Portal"}
      </p>
      <p className="mt-1 text-lg font-bold text-white">Next Capital</p>
      <nav className="mt-8 grid gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
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

