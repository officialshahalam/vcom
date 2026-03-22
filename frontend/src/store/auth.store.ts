import { create } from "zustand";
import { api } from "@/services/api";
import { socketService } from "@/services/socket";

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{ user: User; token: string }>("/auth/login", {
        email,
        password,
      });
      api.setToken(res.token);
      socketService.connect(res.token);
      set({ user: res.user, token: res.token, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{ user: User; token: string }>("/auth/register", {
        username,
        email,
        password,
      });
      api.setToken(res.token);
      socketService.connect(res.token);
      set({ user: res.user, token: res.token, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    api.setToken(null);
    socketService.disconnect();
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
