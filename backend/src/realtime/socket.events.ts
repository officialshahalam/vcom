import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { publishMessageForPersistence } from "../queue/producers/message.producer";
import { logInfo, logError } from "../shared/logger";
import { MessageType } from "../modules/messages/message.model";

interface SendMessagePayload {
  chatId: string;
  senderId: string;
  text?: string;
  type?: MessageType;
}

function registerSocketEvents(io: Server, socket: Socket): void {
  logInfo(`Client connected: ${socket.id}`);

  socket.on("join:chat", (chatId: string) => {
    socket.join(chatId);
    logInfo(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on("leave:chat", (chatId: string) => {
    socket.leave(chatId);
    logInfo(`Socket ${socket.id} left chat ${chatId}`);
  });

  socket.on("send:message", async (payload: SendMessagePayload) => {
    const messageJob = {
      messageId: uuidv4(),
      chatId: payload.chatId,
      senderId: payload.senderId,
      text: payload.text ?? "",
      type: payload.type ?? ("text" as MessageType),
      createdAt: new Date(),
    };

    io.to(payload.chatId).emit("receive:message", messageJob);

    try {
      await publishMessageForPersistence(messageJob);
    } catch (err) {
      logError("Failed to publish message", err);
    }
  });

  socket.on("disconnect", () => {
    logInfo(`Client disconnected: ${socket.id}`);
  });
}

export default registerSocketEvents;
