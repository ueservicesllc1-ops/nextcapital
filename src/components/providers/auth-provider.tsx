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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        await setDoc(ref, { ...newUser, createdAt: serverTimestamp() });
        setAppUser(newUser);
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
        await signInWithEmailAndPassword(auth, email, password);
      },
      register: async ({ name, email, password, role = "investor" }) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        await sendEmailVerification(credential.user);
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          name,
          email,
          role,
          createdAt: serverTimestamp(),
          status: "active",
        });
        await setDoc(doc(db, "balances", credential.user.uid), {
          userId: credential.user.uid,
          totalDeposited: 0,
          totalProfit: 0,
          currentBalance: 0,
          updatedAt: serverTimestamp(),
        });
      },
      sendVerificationEmail: async () => {
        if (!auth.currentUser) return;
        await sendEmailVerification(auth.currentUser);
      },
      refreshUser: async () => {
        if (!auth.currentUser) return;
        await reload(auth.currentUser);
        setFirebaseUser(auth.currentUser);
      },
      forgotPassword: async (email: string) => {
        await sendPasswordResetEmail(auth, email);
      },
      logout: async () => {
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
