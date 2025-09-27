import { createContext, createElement, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UsuarioResumen } from "../../api/types";

export type RoleCode = "CLIENTE" | "TIENDA" | "REPARTIDOR" | "ADMIN";

export type SessionUser = UsuarioResumen;

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: {
    user: SessionUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "ayd-auth",
    },
  ),
);

const AuthReadyContext = createContext(false);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    type PersistApi = {
      onFinish?: (callback: () => void) => () => void;
      rehydrate?: () => void;
    };

    const storeWithPersist = useAuthStore as typeof useAuthStore & { persist?: PersistApi };
    const persistApi = storeWithPersist.persist;
    if (persistApi?.onFinish) {
      unsub = persistApi.onFinish(() => setReady(true));
      persistApi.rehydrate?.();
    } else {
      setReady(true);
    }

    return () => {
      unsub?.();
    };
  }, []);

  if (!ready) {
    return null;
  }

  return createElement(AuthReadyContext.Provider, { value: ready }, children);
}

export function useAuth() {
  const ready = useContext(AuthReadyContext);
  const store = useAuthStore();
  return { ...store, ready };
}

export function useAccessToken() {
  return useAuthStore((state) => state.accessToken);
}

export function useRoles() {
  return useAuthStore((state) => state.user?.roles ?? []);
}

export function useIsAuthenticated() {
  return useAuthStore((state) => Boolean(state.accessToken && state.user));
}

export function resetAuthStore() {
  useAuthStore.getState().clearSession();
}
