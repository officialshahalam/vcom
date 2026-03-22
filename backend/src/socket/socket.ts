import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthPayload } from "../types/express.d";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

// Map userId -> socket (latest connection wins)
const clients = new Map<string, ExtendedWebSocket>();

export function initWebSocket(server: http.Server): void {
  const wss = new WebSocketServer({ server });

  // Heartbeat to detect stale connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const socket = ws as ExtendedWebSocket;
      if (!socket.isAlive) {
        socket.terminate();
        return;
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  wss.on("connection", (ws: WebSocket, req) => {
    const socket = ws as ExtendedWebSocket;
    socket.isAlive = true;

    // Authenticate via ?token=<jwt> query param
    const url = new URL(req.url ?? "/", `ws://localhost`);
    const token = url.searchParams.get("token");
    if (!token) {
      socket.close(1008, "Missing token");
      return;
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
      socket.userId = payload.userId;
      clients.set(payload.userId, socket);
      console.log(`WS: user ${payload.userId} connected`);
    } catch {
      socket.close(1008, "Invalid token");
      return;
    }

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as {
          type: string;
          to: string;
          payload: unknown;
        };
        // Route message to target user if online
        const target = clients.get(msg.to);
        if (target?.readyState === WebSocket.OPEN) {
          target.send(
            JSON.stringify({ type: msg.type, from: socket.userId, payload: msg.payload })
          );
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on("close", () => {
      if (socket.userId) {
        clients.delete(socket.userId);
        console.log(`WS: user ${socket.userId} disconnected`);
      }
    });
  });
}

/** Send an event to a specific connected user (called by REST handlers). */
export function sendToUser(userId: string, event: object): void {
  const socket = clients.get(userId);
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(event));
  }
}
