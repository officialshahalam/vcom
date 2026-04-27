import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { randomInt } from "node:crypto";
import { OTPType } from "../../generated/prisma/enums";
import { prisma } from "../../configs/prisma/client";
import { redis } from "../../configs/redis";
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  OTP_EXPIRY_MINUTES,
  REDIS_KEYS,
} from "../../packages/constants/app.constants";
import { AppError } from "../../packages/error-handler/app-error";
import { sendOtp } from "../../packages/sendMail/sendOtp";
import {
  checkOtpRestrictions,
  clearOtpFor,
  issueOtpFor,
  traceOtpRequests,
  verifyOtpFor,
} from "../../packages/utils/auth.helper";

const signToken = (
  payload: { userId: number; mobileNumber: string },
  secret: string,
  expiresIn: string,
): string => jwt.sign(payload, secret, { expiresIn } as SignOptions);

const hashToken = async (token: string): Promise<string> =>
  bcrypt.hash(token, 10);

const buildAuthResponse = (user: {
  id: number;
  fullName: string;
  username: string;
  mobileNumber: string;
  email: string | null;
  profilePicture: string | null;
  bio: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
}) => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  mobileNumber: user.mobileNumber,
  email: user.email,
  profilePicture: user.profilePicture,
  bio: user.bio,
  isVerified: user.isVerified,
  isOnline: user.isOnline,
  lastSeen: user.lastSeen,
});

const generateOtpCode = (): string => randomInt(1000, 10000).toString();

const pendingSignupKey = (requestId: number): string =>
  `signup_pending:${requestId}`;
const pendingSignupOtpIdentifier = (requestId: number): string =>
  `signup:${requestId}`;

const issueAuthTokens = async (user: {
  id: number;
  mobileNumber: string;
}): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = signToken(
    { userId: user.id, mobileNumber: user.mobileNumber },
    JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES_IN,
  );

  const refreshToken = signToken(
    { userId: user.id, mobileNumber: user.mobileNumber },
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN,
  );

  await redis.set(
    REDIS_KEYS.refresh(user.id),
    await hashToken(refreshToken),
    "EX",
    7 * 24 * 60 * 60,
  );

  return { accessToken, refreshToken };
};

const generateSignupRequestId = async (): Promise<number> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = randomInt(100_000_000, 1_000_000_000);
    const exists = await redis.exists(pendingSignupKey(candidate));
    if (!exists) return candidate;
  }

  throw new AppError("Unable to generate unique signup request ID. Please try again.", 503);
};

const createOtp = async (
  userId: number,
  mobileNumber: string,
  type: OTPType,
): Promise<void> => {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.oTP.create({
    data: {
      userId,
      code,
      type,
      expiresAt,
    },
  });

  await sendOtp({ mobileNumber, otp: code, type });
};

export const authService = {
  signup: async (input: {
    fullName: string;
    username: string;
    mobileNumber: string;
    password: string;
  }) => {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNumber: input.mobileNumber },
          { username: input.username },
        ],
      },
    });

    if (existing) {
      throw new AppError("User already exists", 409);
    }

    await checkOtpRestrictions(input.mobileNumber);
    await traceOtpRequests(input.mobileNumber);

    const passwordHash = await bcrypt.hash(input.password, 12);
    const requestId = await generateSignupRequestId();
    const ttlSeconds = OTP_EXPIRY_MINUTES * 60;
    const otpIdentifier = pendingSignupOtpIdentifier(requestId);
    const otp = await issueOtpFor(otpIdentifier, ttlSeconds);

    await redis.set(
      pendingSignupKey(requestId),
      JSON.stringify({
        fullName: input.fullName,
        username: input.username,
        mobileNumber: input.mobileNumber,
        passwordHash,
      }),
      "EX",
      ttlSeconds,
    );

    await sendOtp({
      mobileNumber: input.mobileNumber,
      otp,
      type: OTPType.SIGNUP,
      userData: {
        fullName: input.fullName,
        username: input.username,
        mobileNumber: input.mobileNumber,
      },
    });

    return {
      message: "OTP sent",
      userId: requestId,
      userData: {
        fullName: input.fullName,
        username: input.username,
        mobileNumber: input.mobileNumber,
      },
    };
  },

  verifyOtp: async (input: { userId: number; otp: string }) => {
    const pendingSignupRaw = await redis.get(pendingSignupKey(input.userId));
    if (pendingSignupRaw) {
      const otpIdentifier = pendingSignupOtpIdentifier(input.userId);
      await verifyOtpFor(otpIdentifier, input.otp);

      const pendingSignup = JSON.parse(pendingSignupRaw) as {
        fullName: string;
        username: string;
        mobileNumber: string;
        passwordHash: string;
      };

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { mobileNumber: pendingSignup.mobileNumber },
            { username: pendingSignup.username },
          ],
        },
      });

      if (existing) {
        await redis.del(pendingSignupKey(input.userId));
        await clearOtpFor(otpIdentifier);
        throw new AppError("User already exists", 409);
      }

      const user = await prisma.user.create({
        data: {
          fullName: pendingSignup.fullName,
          username: pendingSignup.username,
          mobileNumber: pendingSignup.mobileNumber,
          passwordHash: pendingSignup.passwordHash,
          isVerified: true,
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      await redis.del(pendingSignupKey(input.userId));

      const { accessToken, refreshToken } = await issueAuthTokens(user);

      return {
        accessToken,
        refreshToken,
        user: buildAuthResponse(user),
      };
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: input.userId,
        code: input.otp,
        isUsed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const user = await prisma.user.update({
      where: { id: input.userId },
      data: { isVerified: true, isOnline: true, lastSeen: new Date() },
    });

    const { accessToken, refreshToken } = await issueAuthTokens(user);

    return {
      accessToken,
      refreshToken,
      user: buildAuthResponse(user),
    };
  },

  login: async (input: { mobileNumber: string; password: string }) => {
    const user = await prisma.user.findFirst({
      where: { mobileNumber: input.mobileNumber },
    });
    if (!user || !user.isVerified) {
      throw new AppError("Invalid credentials", 401);
    }

    const passwordMatch = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    // Presence (isOnline) is managed by the WebSocket connection lifecycle.
    // Login only issues tokens — the WS connect handler will mark the user online.

    const accessToken = signToken(
      { userId: user.id, mobileNumber: user.mobileNumber },
      JWT_ACCESS_SECRET,
      JWT_ACCESS_EXPIRES_IN,
    );

    const refreshToken = signToken(
      { userId: user.id, mobileNumber: user.mobileNumber },
      JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRES_IN,
    );

    await redis.set(
      REDIS_KEYS.refresh(user.id),
      await hashToken(refreshToken),
      "EX",
      7 * 24 * 60 * 60,
    );

    return {
      accessToken,
      refreshToken,
      user: buildAuthResponse(user),
    };
  },

  logout: async (userId: number) => {
    await redis.del(REDIS_KEYS.refresh(userId));
    // Presence (isOnline) is managed by the WebSocket close handler.
    // Logout only invalidates the refresh token.
    return { message: "Logged out" };
  },

  forgotPassword: async (mobileNumber: string) => {
    const user = await prisma.user.findFirst({ where: { mobileNumber } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await checkOtpRestrictions(mobileNumber);
    await traceOtpRequests(mobileNumber);

    await createOtp(user.id, user.mobileNumber, OTPType.RESET_PASSWORD);
    return { message: "OTP sent", userId: user.id };
  },

  resetPassword: async (input: {
    userId: number;
    otp: string;
    newPassword: string;
  }) => {
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: input.userId,
        code: input.otp,
        type: OTPType.RESET_PASSWORD,
        isUsed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    await prisma.user.update({
      where: { id: input.userId },
      data: { passwordHash: await bcrypt.hash(input.newPassword, 12) },
    });

    await redis.del(REDIS_KEYS.refresh(input.userId));
    return { message: "Password reset successful" };
  },

  refreshToken: async (refreshToken: string) => {
    const decoded = jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET,
    ) as {
      userId: number;
      mobileNumber: string;
    };

    const storedHash = await redis.get(REDIS_KEYS.refresh(decoded.userId));
    if (!storedHash) {
      throw new AppError("Refresh token invalid", 401);
    }

    const isValid = await bcrypt.compare(refreshToken, storedHash);
    if (!isValid) {
      throw new AppError("Refresh token invalid", 401);
    }

    const accessToken = signToken(
      { userId: decoded.userId, mobileNumber: decoded.mobileNumber },
      JWT_ACCESS_SECRET,
      JWT_ACCESS_EXPIRES_IN,
    );

    return { accessToken };
  },
};
