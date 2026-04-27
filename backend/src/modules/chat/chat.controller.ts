import type { Request, Response } from "express";
import { chatService } from "./chat.service";

export const chatController = {
  getConversations: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = await chatService.getConversations(userId);
    res.status(200).json({ success: true, data });
  },

  getOrCreateConversation: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const participantId = Number(req.body.participantId);
    const data = await chatService.getOrCreateConversation(userId, participantId);
    res.status(200).json({ success: true, data });
  },

  getMessages: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const conversationId = Number(req.params.conversationId);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 30);

    const data = await chatService.getMessages(userId, conversationId, page, limit);
    res.status(200).json({ success: true, data });
  },

  sendMessage: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const conversationId = Number(req.params.conversationId);
    const data = await chatService.sendMessage(userId, conversationId, {
      content: req.body.content,
    });

    res.status(200).json({ success: true, data });
  },

  markConversationRead: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const conversationId = Number(req.params.conversationId);
    const data = await chatService.markConversationRead(userId, conversationId);

    res.status(200).json({ success: true, data });
  },
};
