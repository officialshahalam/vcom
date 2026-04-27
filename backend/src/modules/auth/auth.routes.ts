import { Router } from "express";
import { authController } from "./auth.controller";
import { asyncHandler } from "../../packages/error-handler/async-handler";
import { validateRequest } from "../../packages/middlewares/validateRequest";
import { authenticate } from "../../packages/middlewares/authenticate";
import { generalIpRateLimiter, otpRateLimiter } from "../../packages/middlewares/rateLimiter";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  signupSchema,
  verifyOtpSchema,
} from "./auth.validator";

export const authRouter: ReturnType<typeof Router> = Router();

authRouter.use(generalIpRateLimiter);

authRouter.post("/signup", otpRateLimiter, validateRequest(signupSchema), asyncHandler(authController.signup));
authRouter.post("/verify-otp", validateRequest(verifyOtpSchema), asyncHandler(authController.verifyOtp));
authRouter.post("/login", validateRequest(loginSchema), asyncHandler(authController.login));
authRouter.post("/logout", authenticate, asyncHandler(authController.logout));
authRouter.post("/forgot-password", otpRateLimiter, validateRequest(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
authRouter.post("/reset-password", validateRequest(resetPasswordSchema), asyncHandler(authController.resetPassword));
authRouter.post("/refresh-token", validateRequest(refreshTokenSchema), asyncHandler(authController.refreshToken));
