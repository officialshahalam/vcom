import { z } from "zod";

export const getOrCreateConversationSchema = z.object({
  body: z.object({
    participantId: z.number().int().positive(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    conversationId: z.coerce.number().int().positive(),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(30),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    conversationId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    content: z.string().min(1),
  }),
});

export const markReadSchema = z.object({
  params: z.object({
    conversationId: z.coerce.number().int().positive(),
  }),
});
