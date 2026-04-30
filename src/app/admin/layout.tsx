"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <div className="lg:flex">
        <Sidebar admin />
        <div className="min-h-screen flex-1">{children}</div>
      </div>
    </AuthGuard>
  );
}
