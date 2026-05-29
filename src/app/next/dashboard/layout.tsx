"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="lg:flex">
        <Sidebar />
        <div className="min-h-screen flex-1">{children}</div>
      </div>
    </AuthGuard>
  );
}
