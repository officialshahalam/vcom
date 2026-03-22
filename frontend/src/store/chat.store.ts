import { create } from "zustand";
import { api } from "@/services/api";
import { socketService } from "@/services/socket";

export interface Message {
  _id: string;
  sender: { _id: string; username: string; avatar: string | null };
  receiver: { _id: string; username: string; avatar: string | null };
  content: string;
  type: "text" | "image" | "file";
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: { _id: string; username: string; avatar: string | null; isOnline: boolean };
  lastMessage: Message;
  unread: number;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  typingUsers: Record<string, boolean>;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (partnerId: string, page?: number) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => void;
  setTyping: (receiverId: string, isTyping: boolean) => void;
  markRead: (senderId: string) => void;
  addIncomingMessage: (message: Message) => void;
  setTypingStatus: (senderId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  typingUsers: {},
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ conversations: Conversation[] }>("/messages/conversations");
      set({ conversations: res.conversations, isLoading: false });
    } catch (err) {
      console.error("[ChatStore] fetchConversations:", err);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (partnerId, page = 1) => {
    set({ isLoading: true });
    try {
      const res = await api.get<{ messages: Message[] }>(
        `/messages/${partnerId}?page=${page}`
      );
      set((state) => ({
        messages: {
          ...state.messages,
          [partnerId]: page === 1 ? res.messages : [...(state.messages[partnerId] ?? []), ...res.messages],
        },
        isLoading: false,
      }));
    } catch (err) {
      console.error("[ChatStore] fetchMessages:", err);
      set({ isLoading: false });
    }
  },

  sendMessage: (receiverId, content) => {
    socketService.send({ type: "chat:send", receiverId, content });
  },

  setTyping: (receiverId, isTyping) => {
    socketService.send({ type: "chat:typing", receiverId, isTyping });
  },

  markRead: (senderId) => {
    socketService.send({ type: "chat:read", senderId });
    api.patch(`/messages/read/${senderId}`, {}).catch(() => {});
  },

  addIncomingMessage: (message) => {
    // Import auth store lazily to avoid circular dependency
    const currentUserId = require("./auth.store").useAuthStore.getState().user?._id;
    const partnerId =
      message.sender._id === currentUserId
        ? message.receiver._id
        : message.sender._id;

    set((state) => ({
      messages: {
        ...state.messages,
        [partnerId]: [
          ...(state.messages[partnerId] ?? []),
          message,
        ],
      },
      conversations: state.conversations.map((c) =>
        c._id._id === partnerId
          ? { ...c, lastMessage: message, unread: c.unread + 1 }
          : c
      ),
    }));
  },

  setTypingStatus: (senderId, isTyping) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [senderId]: isTyping },
    }));
  },
}));
