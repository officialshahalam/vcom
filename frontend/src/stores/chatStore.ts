import { create } from "zustand";
import { chatService } from "../services/chatService";
import { useAuthStore } from "./authStore";
import { useWebSocketStore } from "./webSocketStore";
import { WS_EVENTS } from "../constants";
import type { Conversation, DeliveryAck, Message, PresenceUpdate, ReadAck, TypingEvent } from "../types";

type ChatStore = {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  unreadCounts: Record<string, number>;
  setActiveConversation: (conversationId: string | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  onNewMessage: (message: Message) => void;
  onMessageDelivered: (data: DeliveryAck) => void;
  onMessageRead: (data: ReadAck) => void;
  onTypingStart: (data: TypingEvent) => void;
  onTypingStop: (data: TypingEvent) => void;
  onUserPresenceUpdate: (data: PresenceUpdate) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  unreadCounts: {},

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
  },

  loadConversations: async () => {
    const response = await chatService.getConversations();
    const conversations = response.data.data as Conversation[];
    const unreadCounts = conversations.reduce<Record<string, number>>((acc, item) => {
      acc[String(item.id)] = item.unreadCount;
      return acc;
    }, {});
    set({ conversations, unreadCounts });
  },

  loadMessages: async (conversationId, page = 1) => {
    const response = await chatService.getMessages(Number(conversationId), page);
    const incoming = (response.data.data as Message[]).slice().reverse();

    set((state) => {
      const previous = page === 1 ? [] : state.messages[conversationId] ?? [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...incoming, ...previous],
        },
      };
    });

    // Emit MESSAGE_DELIVERED for messages not sent by me and not yet delivered.
    const currentUserId = useAuthStore.getState().user?.id;
    const wsSend = useWebSocketStore.getState().send;
    if (currentUserId != null) {
      incoming
        .filter((msg) => msg.senderId !== currentUserId && !msg.deliveredAt)
        .forEach((msg) => {
          wsSend(WS_EVENTS.MESSAGE_DELIVERED, { messageId: msg.id, conversationId: Number(conversationId) });
        });
    }
  },

  sendMessage: async (conversationId, content) => {
    const currentUser = useAuthStore.getState().user;
    const clientId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempId = -Date.now();
    const optimistic: Message = {
      id: tempId,
      conversationId: Number(conversationId),
      senderId: currentUser?.id ?? 0,
      content,
      sentAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      clientId,
    };

    get().onNewMessage(optimistic);

    useWebSocketStore.getState().send(WS_EVENTS.SEND_MESSAGE, {
      conversationId: Number(conversationId),
      content,
      clientId,
    });
  },

  markAsRead: async (conversationId) => {
    // Use WebSocket only — avoids duplicate processing from both HTTP and WS paths.
    useWebSocketStore.getState().send(WS_EVENTS.MESSAGE_READ, { conversationId: Number(conversationId) });
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: 0,
      },
    }));
  },

  onNewMessage: (message) => {
    const conversationId = String(message.conversationId);
    const currentUserId = useAuthStore.getState().user?.id;
    const wsSend = useWebSocketStore.getState().send;

    // If this is a real (server) message from another user, ack delivered only if not already.
    if (message.id > 0 && currentUserId && message.senderId !== currentUserId && !message.deliveredAt) {
      wsSend(WS_EVENTS.MESSAGE_DELIVERED, {
        messageId: message.id,
        conversationId: message.conversationId,
      });
    }

    set((state) => {
      const existing = state.messages[conversationId] ?? [];

      // If the server echo carries a clientId, replace the matching optimistic temp
      // entry instead of appending (prevents ghost duplicates for the sender).
      if (message.clientId) {
        const tempIndex = existing.findIndex((m) => m.clientId === message.clientId);
        if (tempIndex >= 0) {
          const replaced = [...existing];
          replaced[tempIndex] = message;
          return {
            messages: { ...state.messages, [conversationId]: replaced },
            conversations: state.conversations.map((c) =>
              c.id === message.conversationId
                ? { ...c, messages: [message], updatedAt: message.sentAt }
                : c,
            ),
          };
        }
      }

      // Dedupe by real id (prevents duplicate appends from multiple broadcast paths).
      if (message.id > 0 && existing.some((m) => m.id === message.id)) {
        return state;
      }

      const nextMessages = [...existing, message];
      const nextConversations = state.conversations.map((c) =>
        c.id === message.conversationId
          ? { ...c, messages: [message], updatedAt: message.sentAt }
          : c,
      );

      return {
        messages: { ...state.messages, [conversationId]: nextMessages },
        conversations: nextConversations,
      };
    });
  },

  onMessageDelivered: (data) => {
    const conversationId = String(data.conversationId);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((msg) =>
          msg.id === data.messageId ? { ...msg, deliveredAt: new Date().toISOString() } : msg,
        ),
      },
    }));
  },

  onMessageRead: (data) => {
    set((state) => ({
      messages: Object.fromEntries(
        Object.entries(state.messages).map(([key, value]) => [
          key,
          value.map((msg) => (msg.id === data.messageId ? { ...msg, readAt: data.readAt } : msg)),
        ]),
      ),
    }));
  },

  onTypingStart: (data) => {
    const key = String(data.conversationId);
    set((state) => {
      const existing = state.typingUsers[key] ?? [];
      if (existing.includes(String(data.userId))) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [key]: [...existing, String(data.userId)],
        },
      };
    });
  },

  onTypingStop: (data) => {
    const key = String(data.conversationId);
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [key]: (state.typingUsers[key] ?? []).filter((userId) => userId !== String(data.userId)),
      },
    }));
  },

  onUserPresenceUpdate: (data) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) => ({
        ...conversation,
        participants: conversation.participants.map((participant) =>
          participant.user.id === data.userId
            ? {
                ...participant,
                user: {
                  ...participant.user,
                  isOnline: data.isOnline,
                  lastSeen: data.lastSeen,
                },
              }
            : participant,
        ),
      })),
    }));
  },
}));
