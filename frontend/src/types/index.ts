export type OtpType = "SIGNUP" | "RESET_PASSWORD";

export type User = {
  id: number;
  fullName: string;
  username: string;
  mobileNumber?: string;
  profilePicture: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: string;
};

export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  sender?: Pick<User, "id" | "fullName" | "username" | "profilePicture">;
  clientId?: string;
};

export type Conversation = {
  id: number;
  participants: Array<{ user: User }>;
  messages: Message[];
  unreadCount: number;
  updatedAt: string;
};

export type PresenceUpdate = {
  userId: number;
  isOnline: boolean;
  lastSeen: string;
};

export type TypingEvent = {
  userId: number;
  conversationId: number;
};

export type DeliveryAck = {
  messageId: number;
  conversationId: number;
};

export type ReadAck = {
  messageId: number;
  userId: number;
  readAt: string;
};
