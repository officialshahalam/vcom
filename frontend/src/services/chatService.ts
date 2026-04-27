import { api } from "./api";

export const chatService = {
  getConversations: () => api.get("/chat/conversations"),
  getOrCreateConversation: (participantId: number) => api.post("/chat/conversations", { participantId }),
  getMessages: (conversationId: number, page = 1, limit = 30) =>
    api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
  sendMessage: (conversationId: number, content: string) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { content }),
  markAsRead: (conversationId: number) => api.post(`/chat/conversations/${conversationId}/read`),
};
