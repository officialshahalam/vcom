const messageService = require("./message.service");

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, type } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ message: "receiverId and content are required" });
    }
    const message = await messageService.sendMessage({
      senderId: req.userId,
      receiverId,
      content,
      type,
    });
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const messages = await messageService.getConversation(req.userId, partnerId, page);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
};

const getConversationList = async (req, res, next) => {
  try {
    const conversations = await messageService.getConversationList(req.userId);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { senderId } = req.params;
    await messageService.markAsRead(senderId, req.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getConversation, getConversationList, markAsRead };
