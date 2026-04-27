const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const JWT_ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");
export const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
export const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);

export const REDIS_KEYS = {
  refresh: (userId: number) => `refresh:${userId}`,
  presence: (userId: number) => `presence:${userId}`,
  call: (callId: string) => `call:${callId}`,
  typing: (conversationId: number, userId: number) => `typing:${conversationId}:${userId}`,
  otpAttempts: (userId: number) => `otp_attempts:${userId}`,
};

export const QUEUES = {
  OTP: "otp.queue",
  CHAT_MESSAGE: "chat.message",
  NOTIFICATION: "notification.queue",
} as const;

export const WS_EVENTS = {
  SEND_MESSAGE: "SEND_MESSAGE",
  NEW_MESSAGE: "NEW_MESSAGE",
  MESSAGE_DELIVERED: "MESSAGE_DELIVERED",
  MESSAGE_READ: "MESSAGE_READ",
  USER_ONLINE: "USER_ONLINE",
  TYPING_START: "TYPING_START",
  TYPING_STOP: "TYPING_STOP",
  CALL_OFFER: "CALL_OFFER",
  CALL_ANSWER: "CALL_ANSWER",
  CALL_ICE_CANDIDATE: "CALL_ICE_CANDIDATE",
  CALL_END: "CALL_END",
  CALL_REJECTED: "CALL_REJECTED",
  HEARTBEAT: "HEARTBEAT",
} as const;

export const PRESENCE_TTL_SECONDS = 30;
export const TYPING_TTL_SECONDS = 5;
export const CALL_TTL_SECONDS = 60;
