import { randomInt } from "node:crypto";
import { redis } from "../../configs/redis";
import { AppError } from "../error-handler/app-error";

const OTP_TTL_SECONDS = 5 * 60;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_SPAM_WINDOW_SECONDS = 60 * 60;
const OTP_SPAM_LIMIT = 3;
const OTP_LOCK_SECONDS = 30 * 60;
const OTP_MAX_FAILED_ATTEMPTS = 3;

const otpLockKey = (identifier: string): string => `otp_lock:${identifier}`;
const otpSpamLockKey = (identifier: string): string => `otp_spam_lock:${identifier}`;
const otpCooldownKey = (identifier: string): string => `otp_cooldown:${identifier}`;
const otpRequestCountKey = (identifier: string): string => `otp_request_count:${identifier}`;

const otpCodeKey = (identifier: string): string => `otp:${identifier}`;
const otpAttemptKey = (identifier: string): string => `otp_attempts:${identifier}`;

export const checkOtpRestrictions = async (identifier: string): Promise<void> => {
  if (await redis.get(otpLockKey(identifier))) {
    throw new AppError("Account is locked due to multiple failed OTP attempts. Try again later.", 429);
  }

  if (await redis.get(otpSpamLockKey(identifier))) {
    throw new AppError("Too many OTP requests. Please try again after 1 hour.", 429);
  }

  if (await redis.get(otpCooldownKey(identifier))) {
    throw new AppError("Please wait 1 minute before requesting a new OTP.", 429);
  }
};

export const traceOtpRequests = async (identifier: string): Promise<void> => {
  const count = Number((await redis.get(otpRequestCountKey(identifier))) ?? "0");

  if (count >= OTP_SPAM_LIMIT) {
    await redis.set(otpSpamLockKey(identifier), "locked", "EX", OTP_SPAM_WINDOW_SECONDS);
    throw new AppError("Too many OTP requests. Please try again after 1 hour.", 429);
  }

  await redis.set(otpRequestCountKey(identifier), String(count + 1), "EX", OTP_SPAM_WINDOW_SECONDS);
};

export const issueOtpFor = async (
  identifier: string,
  ttlSeconds = OTP_TTL_SECONDS,
): Promise<string> => {
  const otp = randomInt(1000, 10000).toString();
  await redis.set(otpCodeKey(identifier), otp, "EX", ttlSeconds);
  await redis.del(otpAttemptKey(identifier));
  await redis.set(otpCooldownKey(identifier), "true", "EX", OTP_COOLDOWN_SECONDS);
  return otp;
};

export const verifyOtpFor = async (identifier: string, otp: string): Promise<void> => {
  const storedOtp = await redis.get(otpCodeKey(identifier));
  if (!storedOtp) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const failedAttempt = Number((await redis.get(otpAttemptKey(identifier))) ?? "0");

  if (storedOtp !== otp) {
    if (failedAttempt + 1 >= OTP_MAX_FAILED_ATTEMPTS) {
      await redis.set(otpLockKey(identifier), "locked", "EX", OTP_LOCK_SECONDS);
      await redis.del(otpCodeKey(identifier), otpAttemptKey(identifier));
      throw new AppError("Too many failed OTP attempts. Account locked for 30 minutes.", 429);
    }

    await redis.set(otpAttemptKey(identifier), String(failedAttempt + 1), "EX", OTP_TTL_SECONDS);
    throw new AppError(`Incorrect OTP. ${OTP_MAX_FAILED_ATTEMPTS - (failedAttempt + 1)} attempts left.`, 400);
  }

  await redis.del(otpCodeKey(identifier), otpAttemptKey(identifier));
};

export const clearOtpFor = async (identifier: string): Promise<void> => {
  await redis.del(otpCodeKey(identifier), otpAttemptKey(identifier));
};
