import { Response } from "express";
import { AuthRequest } from "../../types/express.d";
import { getConversation, markAsRead, sendMessage } from "./chat.service";

export async function send(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { receiverId, content } = req.body as { receiverId: string; content: string };
    if (!receiverId || !content) {
      res.status(400).json({ message: "receiverId and content are required" });
      return;
    }
    const message = await sendMessage(req.user!.userId, receiverId, content);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function conversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { peerId } = req.params;
    const messages = await getConversation(req.user!.userId, peerId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function readMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { messageId } = req.params;
    const message = await markAsRead(messageId);
    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
