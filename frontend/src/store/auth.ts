import { create } from "zustand";

import { authApi } from "@/api/client";
import type { User } from "@/types";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  ready: boolean;
  setSession: (accessToken: string, user?: User | null) => void;
  loadMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("accessToken"),
  user: null,
  ready: false,
  setSession: (accessToken, user = null) => {
    localStorage.setItem("accessToken", accessToken);
    set({ accessToken, user });
  },
  loadMe: async () => {
    if (!localStorage.getItem("accessToken")) {
      set({ ready: true, user: null, accessToken: null });
      return;
    }

    try {
      const { data } = await authApi.me();
      set({ user: data.user, accessToken: localStorage.getItem("accessToken"), ready: true });
    } catch {
      localStorage.removeItem("accessToken");
      set({ user: null, accessToken: null, ready: true });
    }
  },
  signOut: async () => {
    try {
      await authApi.signOut();
    } finally {
      localStorage.removeItem("accessToken");
      set({ accessToken: null, user: null });
    }
  },
}));
