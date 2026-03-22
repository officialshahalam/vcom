import { Request, Response } from "express";
import User from "../models/User";

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await User.find({}, { password: 0 });
  res.json({ success: true, data: users });
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = await User.findById(req.params.id, { password: 0 });
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.json({ success: true, data: user });
};
