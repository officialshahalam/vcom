import { Router } from "express";
import { chatController } from "./chat.controller";
import { asyncHandler } from "../../packages/error-handler/async-handler";
import { authenticate } from "../../packages/middlewares/authenticate";
import { validateRequest } from "../../packages/middlewares/validateRequest";
import {
  getOrCreateConversationSchema,
  getMessagesSchema,
  sendMessageSchema,
  markReadSchema,
} from "./chat.validator";

export const chatRouter: ReturnType<typeof Router> = Router();

chatRouter.use(authenticate);

chatRouter.get("/conversations", asyncHandler(chatController.getConversations));
chatRouter.post("/conversations", validateRequest(getOrCreateConversationSchema), asyncHandler(chatController.getOrCreateConversation));
chatRouter.get("/conversations/:conversationId/messages", validateRequest(getMessagesSchema), asyncHandler(chatController.getMessages));
chatRouter.post(
  "/conversations/:conversationId/messages",
  validateRequest(sendMessageSchema),
  asyncHandler(chatController.sendMessage),
);
chatRouter.post("/conversations/:conversationId/read", validateRequest(markReadSchema), asyncHandler(chatController.markConversationRead));
