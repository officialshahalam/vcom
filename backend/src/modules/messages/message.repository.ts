import mongoose from "mongoose";
import Message, { IMessage, MessageType } from "./message.model";

export interface MessageData {
  messageId: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string;
  createdAt: Date;
}

export type LeanMessage = {
  _id: unknown;
  messageId: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string;
  createdAt: Date;
};

export async function findMessagesByChat(
  chatId: string,
  limit = 50,
  before?: string
): Promise<LeanMessage[]> {
  const query: Record<string, unknown> = { chatId };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  return Message.find(query).sort({ createdAt: -1 }).limit(limit).lean<LeanMessage[]>();
}

export async function bulkInsertMessages(
  messages: MessageData[]
): Promise<mongoose.mongo.BulkWriteResult> {
  if (!messages.length) {
    return { insertedCount: 0 } as unknown as mongoose.mongo.BulkWriteResult;
  }

  const operations = messages.map((message) => ({
    updateOne: {
      filter: { messageId: message.messageId },
      update: { $setOnInsert: message },
      upsert: true,
    },
  }));

  return Message.bulkWrite(operations, { ordered: false });
}
