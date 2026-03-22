import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, register } from "./auth.controller";

const router = Router();

// Stricter rate limiting for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

export default router;
