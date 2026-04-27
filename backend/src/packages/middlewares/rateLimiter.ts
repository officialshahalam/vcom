import type { Request, Response, NextFunction } from "express";
import { redis } from "../../configs/redis";

const otpLimit = 5;
const otpWindowSeconds = 15 * 60;

export const otpRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const mobileNumber = String(req.body?.mobileNumber ?? "");
  if (!mobileNumber) {
    next();
    return;
  }

  const key = `otp_rate:${mobileNumber}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, otpWindowSeconds);
  }

  if (count > otpLimit) {
    res.status(429).json({
      success: false,
      message: "Too many OTP requests. Try again later.",
    });
    return;
  }

  next();
};

export const generalIpRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const key = `ip_rate:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }

  if (count > 100) {
    res.status(429).json({
      success: false,
      message: "Too many requests.",
    });
    return;
  }

  next();
};
