import { prisma } from "../../configs/prisma/client";
import { publishTopic } from "../../configs/rabbitmq/rabbitmq";
import { QUEUES } from "../../packages/constants/app.constants";
import { AppError } from "../../packages/error-handler/app-error";
import { notifyMessageCreated, notifyMessageDelivered, notifyMessageRead } from "./chat.gateway";

const ensureParticipant = async (conversationId: number, userId: number): Promise<void> => {
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
  });

  if (!participant) {
    throw new AppError("Access denied", 403);
  }
};

export const chatService = {
  getConversations: async (userId: number) => {
    const participantRows = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    username: true,
                    profilePicture: true,
                    isOnline: true,
                    lastSeen: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { sentAt: "desc" },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    const conversationIds = participantRows.map((row: { conversationId: number }) => row.conversationId);
    const unreadCounts = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        readReceipts: {
          none: { userId },
        },
      },
      _count: { _all: true },
    });

    const unreadMap = new Map(
      unreadCounts.map((item: { conversationId: number; _count: { _all: number } }) => [item.conversationId, item._count._all]),
    );

    return participantRows.map((row: { conversationId: number; conversation: Record<string, unknown> }) => ({
      ...row.conversation,
      unreadCount: unreadMap.get(row.conversationId) ?? 0,
    }));
  },

  getOrCreateConversation: async (userId: number, participantId: number) => {
    if (userId === participantId) {
      throw new AppError("Cannot create conversation with yourself", 400);
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                profilePicture: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (existing && existing.participants.length === 2) {
      return existing;
    }

    return prisma.conversation.create({
      data: {
        participants: {
          createMany: {
            data: [{ userId }, { userId: participantId }],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                profilePicture: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });
  },

  getMessages: async (userId: number, conversationId: number, page = 1, limit = 30) => {
    await ensureParticipant(conversationId, userId);

    const skip = (page - 1) * limit;
    const messages = await prisma.message.findMany({
      where: { conversationId },
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
      orderBy: { sentAt: "desc" },
      skip,
      take: limit,
    });

    const pendingDeliveryIds = messages
      .filter((msg: { senderId: number; deliveredAt: Date | null }) => msg.senderId !== userId && msg.deliveredAt === null)
      .map((msg: { id: number }) => msg.id);

    if (pendingDeliveryIds.length) {
      const deliveredAt = new Date();
      await prisma.message.updateMany({
        where: { id: { in: pendingDeliveryIds } },
        data: { deliveredAt },
      });

      // Notify the original senders via WebSocket so their ⏱ updates to ✓.
      for (const messageId of pendingDeliveryIds) {
        await notifyMessageDelivered(conversationId, messageId, deliveredAt);
      }

      // Patch the returned objects so the requester also sees the fresh deliveredAt.
      for (const msg of messages) {
        if (pendingDeliveryIds.includes(msg.id)) {
          msg.deliveredAt = deliveredAt;
        }
      }
    }

    return messages;
  },

  sendMessage: async (
    userId: number,
    conversationId: number,
    input: {
      content: string;
    },
  ) => {
    await ensureParticipant(conversationId, userId);

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: input.content,
      },
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

    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    // Real-time fan-out: broadcast NEW_MESSAGE directly to all participant sockets.
    await notifyMessageCreated(conversationId, message.id);

    // Best-effort async publish for downstream consumers (audit, push notifications).
    // The RabbitMQ consumer should NOT re-broadcast — it is for side effects only.
    try {
      await publishTopic(QUEUES.CHAT_MESSAGE, `chat.message.${conversationId}`, {
        conversationId,
        messageId: message.id,
      });
    } catch {
      // Non-critical: real-time broadcast above already reached connected clients.
    }

    return message;
  },

  markConversationRead: async (userId: number, conversationId: number) => {
    await ensureParticipant(conversationId, userId);

    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readReceipts: {
          none: { userId },
        },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) {
      return { message: "Conversation marked as read" };
    }

    const now = new Date();
    const unreadIds = unreadMessages.map((m) => m.id);

    await prisma.messageReadReceipt.createMany({
      data: unreadIds.map((messageId) => ({ messageId, userId, readAt: now })),
      skipDuplicates: true,
    });

    await prisma.message.updateMany({
      where: { id: { in: unreadIds } },
      data: { readAt: now },
    });

    // Single broadcast for all read messages.
    for (const messageId of unreadIds) {
      await notifyMessageRead(conversationId, messageId, userId, now);
    }

    return { message: "Conversation marked as read" };
  },
};
