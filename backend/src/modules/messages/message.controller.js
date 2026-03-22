const asyncHandler = require("../../shared/async-handler");
const messageService = require("./message.service");

const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const limit = Number(req.query.limit || 50);
  const before = req.query.before;

  const messages = await messageService.getMessagesByChat({
    chatId,
    limit,
    before,
  });

  res.json({
    success: true,
    data: messages,
  });
});

module.exports = {
  getMessages,
};
