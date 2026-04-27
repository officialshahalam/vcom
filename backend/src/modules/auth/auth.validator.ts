import { z } from "zod";

export const signupSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2),
      username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/),
      mobileNumber: z.string().min(8).max(20),
      password: z.string().min(8),
      confirmPassword: z.string().min(8),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    userId: z.number().int().positive(),
    otp: z.string().regex(/^\d{4}$/),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    mobileNumber: z.string().min(8).max(20),
    password: z.string().min(8),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    mobileNumber: z.string().min(8).max(20),
  }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      userId: z.number().int().positive(),
      otp: z.string().regex(/^\d{4}$/),
      newPassword: z.string().min(8),
      confirmPassword: z.string().min(8),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});
