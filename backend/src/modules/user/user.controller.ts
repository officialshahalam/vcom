import type { Request, Response } from "express";
import { userService } from "./user.service";

export const userController = {
  getProfile: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = await userService.getCurrentProfile(userId);
    res.status(200).json({ success: true, data });
  },

  updateProfile: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = await userService.updateProfile(
      userId,
      req.body as { fullName?: string; username?: string; bio?: string; profilePicture?: string | null },
    );
    res.status(200).json({ success: true, data });
  },

  searchUsers: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const q = String(req.query.q ?? "");
    const data = await userService.searchUsers(userId, q);
    res.status(200).json({ success: true, data });
  },

  getPublicProfile: async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const data = await userService.getPublicProfile(userId);
    res.status(200).json({ success: true, data });
  },
};
