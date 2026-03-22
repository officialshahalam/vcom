import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storeMessage } from "../services/messageService";

interface WSMessage {
  type: "message" | "offer" | "answer" | "ice-candidate";
  senderId: string;
  receiverId: string;
  payload: unknown;
}

// Map of userId -> WebSocket connection
const clients = new Map<string, WebSocket>();

export const initWebSocket = (server: http.Server): void => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on("message", async (raw) => {
      try {
        const data: WSMessage = JSON.parse(raw.toString());

        // Basic structure validation
        if (
          !data.type ||
          !data.senderId ||
          !data.receiverId
        ) {
          ws.send(
            JSON.stringify({ type: "error", message: "Invalid message format" })
          );
          return;
        }

        // Register the connection with the user's id on first contact
        if (!userId && data.senderId) {
          userId = data.senderId;
          clients.set(userId, ws);
          console.log(`User ${userId} connected via WebSocket`);
        }

        if (data.type === "message") {
          // Persist + queue the chat message
          await storeMessage({
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.payload as string,
          });

          // Forward to recipient if online
          const recipientWs = clients.get(data.receiverId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify(data));
          }
        } else {
          // WebRTC signalling (offer / answer / ice-candidate)
          const recipientWs = clients.get(data.receiverId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
        ws.send(
          JSON.stringify({ type: "error", message: "Failed to process message" })
        );
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
  });

  console.log("WebSocket server initialised");
};
