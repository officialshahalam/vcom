import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_ACCESS_SECRET } from "../constants/app.constants";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload & {
      userId: number;
      mobileNumber: string;
    };

    req.user = { userId: decoded.userId, mobileNumber: decoded.mobileNumber };
    next();
  } catch (_error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
