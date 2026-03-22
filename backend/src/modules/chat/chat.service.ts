import { Message } from "./chat.model";
import { publishMessage } from "../../config/rabbitmq";

const CHAT_QUEUE = "chat.messages";

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
) {
  const message = await Message.create({ sender: senderId, receiver: receiverId, content });

  // Publish to RabbitMQ for async processing / bulk storage
  await publishMessage(CHAT_QUEUE, {
    messageId: message._id,
    senderId,
    receiverId,
    content,
    createdAt: message.createdAt,
  });

  return message;
}

export async function getConversation(userId: string, peerId: string) {
  return Message.find({
    $or: [
      { sender: userId, receiver: peerId },
      { sender: peerId, receiver: userId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender", "name avatar")
    .populate("receiver", "name avatar");
}

export async function markAsRead(messageId: string) {
  return Message.findByIdAndUpdate(messageId, { read: true }, { new: true });
}
