const { WebSocketServer, WebSocket } = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");
const User = require("../modules/auth/auth.model");
const messageService = require("../modules/messages/message.service");

// Map of userId → WebSocket client
const clients = new Map();

const broadcast = (userId, payload) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(payload));
    return true;
  }
  return false;
};

const authenticateWs = (request) => {
  try {
    const { query } = url.parse(request.url, true);
    const token = query.token;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (_) {
    return null;
  }
};

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: process.env.WS_PATH || "/ws" });

  wss.on("connection", async (ws, request) => {
    const userId = authenticateWs(request);

    if (!userId) {
      ws.close(4001, "Unauthorized");
      return;
    }

    // Register client
    clients.set(userId, ws);

    // Mark user online
    await User.findByIdAndUpdate(userId, { isOnline: true, socketId: userId });

    ws.on("message", async (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch (_) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }

      switch (data.type) {
        // ── Chat ──────────────────────────────────────────
        case "chat:send": {
          const { receiverId, content, messageType = "text" } = data;
          if (!receiverId || !content) break;

          const message = await messageService.sendMessage({
            senderId: userId,
            receiverId,
            content,
            type: messageType,
          });

          // Echo back to sender
          ws.send(JSON.stringify({ type: "chat:sent", message }));

          // Deliver to receiver if online
          broadcast(receiverId, { type: "chat:receive", message });
          break;
        }

        case "chat:typing": {
          const { receiverId, isTyping } = data;
          if (receiverId) {
            broadcast(receiverId, { type: "chat:typing", senderId: userId, isTyping });
          }
          break;
        }

        case "chat:read": {
          const { senderId } = data;
          if (senderId) {
            await messageService.markAsRead(senderId, userId);
            broadcast(senderId, { type: "chat:read", readBy: userId });
          }
          break;
        }

        // ── WebRTC Signaling ─────────────────────────────
        case "call:offer": {
          const { receiverId, offer, callType = "video" } = data;
          const caller = await User.findById(userId).select("username");
          broadcast(receiverId, {
            type: "call:incoming",
            callerId: userId,
            callerName: caller?.username ?? "Unknown",
            offer,
            callType,
          });
          break;
        }

        case "call:answer": {
          const { callerId, answer } = data;
          broadcast(callerId, { type: "call:answer", answer, calleeId: userId });
          break;
        }

        case "call:ice-candidate": {
          const { targetId, candidate } = data;
          broadcast(targetId, {
            type: "call:ice-candidate",
            candidate,
            fromId: userId,
          });
          break;
        }

        case "call:end": {
          const { targetId } = data;
          broadcast(targetId, { type: "call:ended", fromId: userId });
          break;
        }

        case "call:reject": {
          const { callerId } = data;
          broadcast(callerId, { type: "call:rejected", calleeId: userId });
          break;
        }

        default:
          ws.send(JSON.stringify({ type: "error", message: `Unknown type: ${data.type}` }));
      }
    });

    ws.on("close", async () => {
      clients.delete(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null,
      });
    });

    ws.on("error", (err) => {
      console.error(`WebSocket error for user ${userId}:`, err.message);
    });

    ws.send(JSON.stringify({ type: "connected", userId }));
  });

  console.log(`WebSocket server ready at ${process.env.WS_PATH || "/ws"}`);
  return wss;
};

module.exports = { setupWebSocket, clients, broadcast };
