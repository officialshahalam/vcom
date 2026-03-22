const Message = require("./message.model");

async function findMessagesByChat(chatId, limit = 50, before) {
  const query = { chatId };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  return Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function bulkInsertMessages(messages) {
  if (!messages.length) {
    return { insertedCount: 0 };
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

module.exports = {
  findMessagesByChat,
  bulkInsertMessages,
};
