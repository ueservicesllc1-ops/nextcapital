"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { AppUser, UserRole } from "@/lib/types";

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(Boolean(auth && db));

  useEffect(() => {
    if (!auth || !db) {
      return;
    }

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setFirebaseUser(nextUser);
      if (!nextUser) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", nextUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setAppUser(snap.data() as AppUser);
      } else {
        const newUser: AppUser = {
          uid: nextUser.uid,
          email: nextUser.email ?? "",
          name: nextUser.displayName ?? "Investor",
          role: "investor",
          createdAt: new Date().toISOString(),
          status: "active",
        };
        try {
          await setDoc(ref, { ...newUser, createdAt: serverTimestamp() });
          setAppUser(newUser);
        } catch (e: any) {
          console.error("Error guardando usuario desde onAuthStateChanged:", e.message);
          // Omitimos el error aquí para no romper el flujo si register ya lo está haciendo.
        }
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      appUser,
      loading,
      login: async (email, password) => {
        if (!auth) throw new Error("Firebase Auth no configurado.");
        await signInWithEmailAndPassword(auth, email, password);
      },
      register: async ({ name, email, password, role = "investor" }) => {
        if (!auth || !db) throw new Error("Firebase Auth/Firestore no configurado.");
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        
        try {
          await updateProfile(credential.user, { displayName: name });
          await sendEmailVerification(credential.user);
        } catch (e: any) {
          throw new Error("Fallo al actualizar perfil/email: " + e.message);
        }

        try {
          await setDoc(doc(db, "users", credential.user.uid), {
            uid: credential.user.uid,
            name,
            email,
            role,
            createdAt: serverTimestamp(),
            status: "active",
          });
        } catch (e: any) {
          throw new Error("Error de permisos guardando usuario (users): " + e.message);
        }

        try {
          await setDoc(doc(db, "balances", credential.user.uid), {
            userId: credential.user.uid,
            totalDeposited: 0,
            totalProfit: 0,
            currentBalance: 0,
            updatedAt: serverTimestamp(),
          });
        } catch (e: any) {
          throw new Error("Error de permisos guardando balance inicial (balances): " + e.message);
        }
      },
      sendVerificationEmail: async () => {
        if (!auth) throw new Error("Firebase Auth no configurado.");
        if (!auth.currentUser) return;
        await sendEmailVerification(auth.currentUser);
      },
      refreshUser: async () => {
        if (!auth) throw new Error("Firebase Auth no configurado.");
        if (!auth.currentUser) return;
        await reload(auth.currentUser);
        setFirebaseUser(auth.currentUser);
      },
      forgotPassword: async (email: string) => {
        if (!auth) throw new Error("Firebase Auth no configurado.");
        await sendPasswordResetEmail(auth, email);
      },
      logout: async () => {
        if (!auth) return;
        await signOut(auth);
      },
    }),
    [appUser, firebaseUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
