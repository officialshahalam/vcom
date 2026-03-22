import { findMessagesByChat, bulkInsertMessages, MessageData, LeanMessage } from "./message.repository";

interface GetMessagesByChatOptions {
  chatId: string;
  limit?: number;
  before?: string;
}

export async function getMessagesByChat({
  chatId,
  limit,
  before,
}: GetMessagesByChatOptions): Promise<LeanMessage[]> {
  return findMessagesByChat(chatId, limit, before);
}

export async function persistMessageBatch(messages: MessageData[]): Promise<unknown> {
  return bulkInsertMessages(messages);
}
