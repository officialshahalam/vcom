export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:3000";

export const COLORS = {
  background: "#000000",
  surface: "#1C1C1E",
  border: "#3A3A3C",
  primaryBlue: "#007AFF",
  primaryCoralFrom: "#FF6B6B",
  primaryCoralTo: "#FF4757",
  textPrimary: "#FFFFFF",
  textSecondary: "#8E8E93",
  online: "#34C759",
};

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
