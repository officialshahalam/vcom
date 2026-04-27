import type { Request, Response } from "express";
import { authService } from "./auth.service";

export const authController = {
  signup: async (req: Request, res: Response) => {
    const data = await authService.signup(req.body as {
      fullName: string;
      username: string;
      mobileNumber: string;
      password: string;
    });

    res.status(200).json({ success: true, data });
  },

  verifyOtp: async (req: Request, res: Response) => {
    const data = await authService.verifyOtp(req.body as { userId: number; otp: string });
    res.status(200).json({ success: true, data });
  },

  login: async (req: Request, res: Response) => {
    const data = await authService.login(req.body as { mobileNumber: string; password: string });
    res.status(200).json({ success: true, data });
  },

  logout: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await authService.logout(userId);
    res.status(200).json({ success: true, data: { message: "Logged out" } });
  },

  forgotPassword: async (req: Request, res: Response) => {
    const data = await authService.forgotPassword(String(req.body.mobileNumber));
    res.status(200).json({ success: true, data });
  },

  resetPassword: async (req: Request, res: Response) => {
    const data = await authService.resetPassword(req.body as { userId: number; otp: string; newPassword: string });
    res.status(200).json({ success: true, data });
  },

  refreshToken: async (req: Request, res: Response) => {
    const data = await authService.refreshToken(String(req.body.refreshToken));
    res.status(200).json({ success: true, data });
  },
};
