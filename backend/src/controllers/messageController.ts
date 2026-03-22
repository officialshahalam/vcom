import { Request, Response } from "express";
import Message from "../models/Message";

export const getConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, peerId } = req.params;

  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: peerId },
      { senderId: peerId, receiverId: userId },
    ],
  }).sort({ createdAt: 1 });

  res.json({ success: true, data: messages });
};

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { senderId, receiverId, content, type } = req.body as {
    senderId: string;
    receiverId: string;
    content: string;
    type?: "text" | "image" | "video" | "file";
  };

  if (!senderId || !receiverId || !content?.trim()) {
    res.status(400).json({
      success: false,
      message: "senderId, receiverId and content are required",
    });
    return;
  }

  const message = await Message.create({
    senderId,
    receiverId,
    content: content.trim(),
    type: type ?? "text",
  });

  res.status(201).json({ success: true, data: message });
};
