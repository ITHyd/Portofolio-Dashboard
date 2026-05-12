import { create } from "zustand";
import { api } from "@/lib/api";

export type Role =
  | "pm"
  | "cp"
  | "rm"
  | "finance"
  | "portfolio_office"
  | "exec_viewer"
  | "admin";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  async login(email, password) {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      const me = await api.get("/auth/me");
      set({ token: data.access_token, user: me.data, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },
  logout() {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
  async hydrate() {
    if (!localStorage.getItem("token")) return;
    try {
      const me = await api.get("/auth/me");
      set({ user: me.data, token: localStorage.getItem("token") });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },
}));
