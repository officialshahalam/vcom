import { api } from "./api";

export const authService = {
  login: (data: { mobileNumber: string; password: string }) => api.post("/auth/login", data),
  signup: (data: {
    fullName: string;
    username: string;
    mobileNumber: string;
    password: string;
    confirmPassword: string;
  }) => api.post("/auth/signup", data),
  verifyOtp: (data: { userId: number; otp: string }) => api.post("/auth/verify-otp", data),
  forgotPassword: (data: { mobileNumber: string }) => api.post("/auth/forgot-password", data),
  resetPassword: (data: { userId: number; otp: string; newPassword: string; confirmPassword: string }) =>
    api.post("/auth/reset-password", data),
  refreshToken: (data: { refreshToken: string }) => api.post("/auth/refresh-token", data),
  logout: () => api.post("/auth/logout"),
};
