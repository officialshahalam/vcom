import { create } from "zustand";
import { authService } from "../services/authService";
import { tokenStorage } from "../services/tokenStorage";
import { userService } from "../services/userService";
import { useWebSocketStore } from "./webSocketStore";
import type { User } from "../types";

type LoginInput = { mobileNumber: string; password: string };
type SignupInput = {
  fullName: string;
  username: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
};
type VerifyOtpInput = { userId: number; otp: string };
type UpdateProfileInput = { fullName?: string; username?: string; bio?: string; profilePicture?: string | null };

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<{ userId: number }>;
  verifyOtp: (data: VerifyOtpInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await authService.login(credentials);
      const payload = response.data.data as { accessToken: string; refreshToken: string; user: User };

      await tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
      set({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        isAuthenticated: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authService.signup(data);
      return { userId: Number(response.data?.data?.userId) };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authService.verifyOtp(data);
      const payload = response.data.data as { accessToken: string; refreshToken: string; user: User };
      await tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
      set({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        isAuthenticated: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Logout should still clear local state if API fails.
    }

    // Close websocket cleanly while the access token is still valid.
    useWebSocketStore.getState().disconnect();

    await tokenStorage.clear();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  refreshTokens: async () => {
    const refreshToken = get().refreshToken ?? (await tokenStorage.getRefreshToken());
    if (!refreshToken) {
      return;
    }

    const response = await authService.refreshToken({ refreshToken });
    const accessToken = response.data.data.accessToken as string;
    await tokenStorage.setTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  updateProfile: async (data) => {
    const response = await userService.updateProfile(data);
    const user = response.data.data as User;
    set({ user });
  },

  hydrateFromStorage: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        set({ isAuthenticated: false, accessToken: null, refreshToken: null, user: null });
        return;
      }

      set({ accessToken, refreshToken, isAuthenticated: true });
      const profile = await userService.getProfile();
      set({ user: profile.data.data as User });
    } catch {
      await tokenStorage.clear();
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
