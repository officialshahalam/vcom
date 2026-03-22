const messageRepository = require("./message.repository");

async function getMessagesByChat({ chatId, limit, before }) {
  return messageRepository.findMessagesByChat(chatId, limit, before);
}

async function persistMessageBatch(messages) {
  return messageRepository.bulkInsertMessages(messages);
}

module.exports = {
  getMessagesByChat,
  persistMessageBatch,
};
