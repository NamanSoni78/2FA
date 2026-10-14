"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PublicUser } from "@/lib/types";

export type AuthDialogMode = "signin" | "signup";

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: PublicUser | null) => void;
  signOut: () => Promise<void>;
  dialogMode: AuthDialogMode | null;
  openAuthDialog: (mode: AuthDialogMode) => void;
  closeAuthDialog: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<AuthDialogMode | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) throw new Error("not ok");
      const data = (await res.json()) as { user: PublicUser | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      /* network hiccup — cookie will expire on its own */
    }
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      setUser,
      signOut,
      dialogMode,
      openAuthDialog: (mode: AuthDialogMode) => setDialogMode(mode),
      closeAuthDialog: () => setDialogMode(null),
    }),
    [user, loading, refresh, signOut, dialogMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
