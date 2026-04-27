import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../../configs/prisma/client";
import { redis } from "../../configs/redis";
import {
  JWT_ACCESS_SECRET,
  CALL_TTL_SECONDS,
  PRESENCE_TTL_SECONDS,
  REDIS_KEYS,
  TYPING_TTL_SECONDS,
  WS_EVENTS,
} from "../../packages/constants/app.constants";

type SocketMessage = {
  type: string;
  payload?: Record<string, unknown>;
};

type ConnectedClient = {
  userId: number;
  socket: WebSocket;
};

const clients = new Map<number, Set<WebSocket>>();
const callMembers = new Map<string, { callerId: number; calleeId: number }>();

let wss: WebSocketServer | null = null;

const sendToUser = (userId: number, message: SocketMessage): void => {
  const userSockets = clients.get(userId);
  if (!userSockets) return;

  const payload = JSON.stringify(message);
  for (const socket of userSockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
};

export const broadcastPresenceToParticipants = async (userId: number, isOnline: boolean, lastSeen: Date): Promise<void> => {
  const conversations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  const participantRows = await prisma.conversationParticipant.findMany({
    where: {
      conversationId: { in: conversations.map((item: { conversationId: number }) => item.conversationId) },
      userId: { not: userId },
    },
    select: { userId: true },
  });

  const uniqueParticipantIds = [...new Set(participantRows.map((item: { userId: number }) => item.userId))];
  for (const participantId of uniqueParticipantIds) {
    sendToUser(participantId, {
      type: WS_EVENTS.USER_ONLINE,
      payload: { userId, isOnline, lastSeen },
    });
  }
};

export const broadcastConversationEvent = async (conversationId: number, message: SocketMessage, excludeUserId?: number): Promise<void> => {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });

  participants.forEach(({ userId }: { userId: number }) => {
    if (excludeUserId && userId === excludeUserId) return;
    sendToUser(userId, message);
  });
};

const parseUserFromRequest = (req: IncomingMessage): { userId: number; mobileNumber: string } | null => {
  // Browsers cannot attach custom headers to native WebSocket handshakes, so the
  // frontend passes the JWT as a URL query parameter: ws://host/?token=...
  // Accept either the Authorization header (for non-browser clients) or the query token.
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let queryToken: string | null = null;
  try {
    const url = new URL(req.url ?? "", "http://localhost");
    queryToken = url.searchParams.get("token");
  } catch {
    queryToken = null;
  }

  const token = headerToken ?? queryToken;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload & {
      userId: number;
      mobileNumber: string;
    };

    return { userId: decoded.userId, mobileNumber: decoded.mobileNumber };
  } catch {
    return null;
  }
};

const markPresence = async (userId: number, isOnline: boolean): Promise<void> => {
  const now = new Date();
  if (isOnline) {
    await redis.set(
      REDIS_KEYS.presence(userId),
      JSON.stringify({ isOnline: true, lastSeen: now.toISOString() }),
      "EX",
      PRESENCE_TTL_SECONDS,
    );
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeen: now } });
    await broadcastPresenceToParticipants(userId, true, now);
  } else {
    await redis.del(REDIS_KEYS.presence(userId));
    await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeen: now } });
    await broadcastPresenceToParticipants(userId, false, now);
  }
};

const startCallTimeout = (callId: string): void => {
  setTimeout(async () => {
    const key = REDIS_KEYS.call(callId);
    const payload = await redis.get(key);
    if (!payload) return;

    const call = JSON.parse(payload) as { callerId: number; calleeId: number; status: string };
    if (call.status !== "RINGING") return;

    await redis.del(key);
    callMembers.delete(callId);

    sendToUser(call.callerId, { type: WS_EVENTS.CALL_END, payload: { callId, reason: "TIMEOUT" } });
    sendToUser(call.calleeId, { type: WS_EVENTS.CALL_END, payload: { callId, reason: "TIMEOUT" } });
  }, CALL_TTL_SECONDS * 1000 + 200);
};

const handleSocketMessage = async (client: ConnectedClient, rawMessage: WebSocket.RawData): Promise<void> => {
  let message: SocketMessage;

  try {
    message = JSON.parse(rawMessage.toString()) as SocketMessage;
  } catch {
    return;
  }

  const payload = message.payload ?? {};

  switch (message.type) {
    case WS_EVENTS.HEARTBEAT: {
      await redis.expire(REDIS_KEYS.presence(client.userId), PRESENCE_TTL_SECONDS);
      return;
    }
    case WS_EVENTS.TYPING_START: {
      const conversationId = Number(payload.conversationId);
      if (!conversationId) return;
      await redis.set(REDIS_KEYS.typing(conversationId, client.userId), "1", "EX", TYPING_TTL_SECONDS);
      await broadcastConversationEvent(
        conversationId,
        { type: WS_EVENTS.TYPING_START, payload: { userId: client.userId, conversationId } },
        client.userId,
      );
      return;
    }
    case WS_EVENTS.TYPING_STOP: {
      const conversationId = Number(payload.conversationId);
      if (!conversationId) return;
      await redis.del(REDIS_KEYS.typing(conversationId, client.userId));
      await broadcastConversationEvent(
        conversationId,
        { type: WS_EVENTS.TYPING_STOP, payload: { userId: client.userId, conversationId } },
        client.userId,
      );
      return;
    }
    case WS_EVENTS.SEND_MESSAGE: {
      const conversationId = Number(payload.conversationId);
      const content = typeof payload.content === "string" ? payload.content : null;
      const clientId = typeof payload.clientId === "string" ? payload.clientId : null;
      if (!conversationId || !content) return;

      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: client.userId },
      });
      if (!participant) return;

      const created = await prisma.message.create({
        data: {
          conversationId,
          senderId: client.userId,
          content,
        },
        include: {
          sender: {
            select: { id: true, fullName: true, username: true, profilePicture: true },
          },
          readReceipts: true,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Direct fan-out to all participants (including the sender) so both ends see the
      // message in real time. The sender's client matches clientId to replace its optimistic bubble.
      await broadcastConversationEvent(conversationId, {
        type: WS_EVENTS.NEW_MESSAGE,
        payload: { conversationId, message: created, clientId },
      });
      return;
    }
    case WS_EVENTS.MESSAGE_DELIVERED: {
      const messageId = Number(payload.messageId);
      const conversationId = Number(payload.conversationId);
      if (!messageId || !conversationId) return;

      // Only mark delivered for messages this user did not send themselves.
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, conversationId: true, deliveredAt: true },
      });
      if (!message || message.conversationId !== conversationId) return;
      if (message.senderId === client.userId) return;
      if (message.deliveredAt) {
        // Already delivered — rebroadcast so late-joining sender clients still get the ack.
        await notifyMessageDelivered(conversationId, messageId, message.deliveredAt);
        return;
      }

      const deliveredAt = new Date();
      await prisma.message.update({
        where: { id: messageId },
        data: { deliveredAt },
      });
      await notifyMessageDelivered(conversationId, messageId, deliveredAt);
      return;
    }
    case WS_EVENTS.MESSAGE_READ: {
      const conversationId = Number(payload.conversationId);
      if (!conversationId) return;

      const unreadMessages = await prisma.message.findMany({
        where: {
          conversationId,
          senderId: { not: client.userId },
          readReceipts: { none: { userId: client.userId } },
        },
        select: { id: true },
      });

      if (unreadMessages.length === 0) return;

      const now = new Date();
      const unreadIds = unreadMessages.map((m) => m.id);

      await prisma.messageReadReceipt.createMany({
        data: unreadIds.map((messageId) => ({ messageId, userId: client.userId, readAt: now })),
        skipDuplicates: true,
      });

      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { readAt: now },
      });

      for (const messageId of unreadIds) {
        await notifyMessageRead(conversationId, messageId, client.userId, now);
      }
      return;
    }
    case WS_EVENTS.CALL_OFFER: {
      const toUserId = Number(payload.toUserId);
      const sdp = payload.sdp;
      if (!toUserId || !sdp) return;

      const callId = randomUUID();
      const callState = {
        callerId: client.userId,
        calleeId: toUserId,
        status: "RINGING",
        startedAt: new Date().toISOString(),
      };

      callMembers.set(callId, { callerId: client.userId, calleeId: toUserId });
      await redis.set(REDIS_KEYS.call(callId), JSON.stringify(callState), "EX", CALL_TTL_SECONDS);
      startCallTimeout(callId);

      sendToUser(toUserId, {
        type: WS_EVENTS.CALL_OFFER,
        payload: { callId, from: client.userId, sdp },
      });
      return;
    }
    case WS_EVENTS.CALL_ANSWER: {
      const callId = String(payload.callId ?? "");
      if (!callId) return;
      const stateRaw = await redis.get(REDIS_KEYS.call(callId));
      if (!stateRaw) return;

      const state = JSON.parse(stateRaw) as { callerId: number; calleeId: number; status: string };
      state.status = "ACTIVE";
      await redis.set(REDIS_KEYS.call(callId), JSON.stringify(state), "EX", CALL_TTL_SECONDS);

      sendToUser(state.callerId, {
        type: WS_EVENTS.CALL_ANSWER,
        payload: { callId, sdp: payload.sdp },
      });
      return;
    }
    case WS_EVENTS.CALL_ICE_CANDIDATE: {
      const callId = String(payload.callId ?? "");
      const stateRaw = await redis.get(REDIS_KEYS.call(callId));
      if (!stateRaw) return;
      const state = JSON.parse(stateRaw) as { callerId: number; calleeId: number };

      const target = state.callerId === client.userId ? state.calleeId : state.callerId;
      sendToUser(target, {
        type: WS_EVENTS.CALL_ICE_CANDIDATE,
        payload: { callId, candidate: payload.candidate },
      });
      return;
    }
    case "CALL_REJECT": {
      const callId = String(payload.callId ?? "");
      const members = callMembers.get(callId);
      if (!members) return;

      await redis.del(REDIS_KEYS.call(callId));
      callMembers.delete(callId);

      sendToUser(members.callerId, {
        type: WS_EVENTS.CALL_REJECTED,
        payload: { callId },
      });
      return;
    }
    case WS_EVENTS.CALL_END: {
      const callId = String(payload.callId ?? "");
      const members = callMembers.get(callId);
      if (!members) return;

      await redis.del(REDIS_KEYS.call(callId));
      callMembers.delete(callId);

      const target = members.callerId === client.userId ? members.calleeId : members.callerId;
      sendToUser(target, { type: WS_EVENTS.CALL_END, payload: { callId, reason: "ENDED" } });
      return;
    }
    default:
      return;
  }
};

export const attachWebSocketServer = (server: HttpServer): void => {
  wss = new WebSocketServer({ server });

  wss.on("error", (error) => {
    console.error("[WS] server error", error);
  });

  wss.on("connection", async (socket, req) => {
    const user = parseUserFromRequest(req);
    if (!user) {
      socket.close(1008, "Unauthorized");
      return;
    }

    const existing = clients.get(user.userId) ?? new Set<WebSocket>();
    existing.add(socket);
    clients.set(user.userId, existing);

    await markPresence(user.userId, true);

    const client: ConnectedClient = { userId: user.userId, socket };

    socket.on("message", async (raw) => {
      try {
        await handleSocketMessage(client, raw);
      } catch (error) {
        console.error("[WS] message handler error", error);
      }
    });

    socket.on("close", async () => {
      try {
        const current = clients.get(user.userId);
        current?.delete(socket);
        if (!current || current.size === 0) {
          clients.delete(user.userId);
          await markPresence(user.userId, false);
        }
      } catch (error) {
        console.error("[WS] close handler error", error);
      }
    });
  });
};

export const notifyMessageCreated = async (conversationId: number, messageId: number): Promise<void> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          username: true,
          profilePicture: true,
        },
      },
      readReceipts: true,
    },
  });

  if (!message) return;

  await broadcastConversationEvent(conversationId, {
    type: WS_EVENTS.NEW_MESSAGE,
    payload: { conversationId, message },
  });
};

export const notifyMessageRead = async (conversationId: number, messageId: number, userId: number, readAt: Date): Promise<void> => {
  await broadcastConversationEvent(conversationId, {
    type: WS_EVENTS.MESSAGE_READ,
    payload: { messageId, userId, readAt },
  });
};

export const notifyMessageDelivered = async (
  conversationId: number,
  messageId: number,
  deliveredAt: Date,
): Promise<void> => {
  await broadcastConversationEvent(conversationId, {
    type: WS_EVENTS.MESSAGE_DELIVERED,
    payload: { messageId, conversationId, deliveredAt },
  });
};

export const closeWebSocketServer = async (): Promise<void> => {
  if (!wss) return;
  await new Promise<void>((resolve) => {
    wss?.close(() => resolve());
  });
};
