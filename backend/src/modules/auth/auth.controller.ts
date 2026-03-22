import { Request, Response } from "express";
import { loginUser, registerUser } from "./auth.service";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };
    if (!name || !email || !password) {
      res.status(400).json({ message: "name, email and password are required" });
      return;
    }
    const result = await registerUser(name, email, password);
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(400).json({ message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }
    const result = await loginUser(email, password);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(400).json({ message });
  }
}
