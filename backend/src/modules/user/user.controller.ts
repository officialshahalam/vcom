import { Response } from "express";
import { AuthRequest } from "../../types/express.d";
import { getAllUsers, getUserById } from "./user.service";

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getUsers(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
