"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { UserRole } from "@/lib/types";

export function AuthGuard({
  children,
  role,
  requireVerifiedEmail = true,
}: {
  children: React.ReactNode;
  role?: UserRole;
  requireVerifiedEmail?: boolean;
}) {
  const { loading, firebaseUser, appUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (requireVerifiedEmail && !firebaseUser.emailVerified) {
      router.replace("/verify-email");
      return;
    }
    if (role && appUser?.role !== role) {
      router.replace("/dashboard");
    }
  }, [appUser?.role, firebaseUser, loading, requireVerifiedEmail, role, router]);

  if (loading || !firebaseUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        Cargando sesión...
      </div>
    );
  }

  if (role && appUser?.role !== role) {
    return null;
  }

  return <>{children}</>;
}
