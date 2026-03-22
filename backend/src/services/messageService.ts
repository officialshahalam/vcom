import Message from "../models/Message";
import { publishMessage } from "../config/rabbitmq";

const MESSAGE_QUEUE = "vcom_messages";

export const storeMessage = async (payload: {
  senderId: string;
  receiverId: string;
  content: string;
  type?: "text" | "image" | "video" | "file";
}): Promise<void> => {
  // Persist to MongoDB
  await Message.create(payload);

  // Also enqueue in RabbitMQ for bulk processing / notifications
  await publishMessage(MESSAGE_QUEUE, payload);
};
