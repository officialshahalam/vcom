const mongoose = require("mongoose");
const Message = require("./message.model");
const { publishMessage } = require("../../config/rabbitmq");

const PAGE_SIZE = 30;

/**
 * Send a message. The payload is first queued to RabbitMQ for bulk processing
 * and also saved directly to MongoDB so the sender gets immediate feedback.
 */
const sendMessage = async ({ senderId, receiverId, content, type = "text" }) => {
  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
    type,
  });

  // Publish to RabbitMQ for async bulk processing / analytics pipeline
  publishMessage({
    event: "new_message",
    messageId: message._id.toString(),
    senderId,
    receiverId,
    content,
    type,
    createdAt: message.createdAt,
  });

  return message.populate([
    { path: "sender", select: "username avatar" },
    { path: "receiver", select: "username avatar" },
  ]);
};

/**
 * Return a paginated conversation between two users.
 */
const getConversation = async (userId, partnerId, page = 1) => {
  const skip = (page - 1) * PAGE_SIZE;

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: partnerId },
      { sender: partnerId, receiver: userId },
    ],
    deletedBy: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(PAGE_SIZE)
    .populate("sender", "username avatar")
    .populate("receiver", "username avatar");

  return messages.reverse();
};

/**
 * Return a list of recent conversations (last message per partner) for a user.
 */
const getConversationList = async (userId) => {
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId.createFromHexString(userId) },
          { receiver: mongoose.Types.ObjectId.createFromHexString(userId) },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", mongoose.Types.ObjectId.createFromHexString(userId)] },
            "$receiver",
            "$sender",
          ],
        },
        lastMessage: { $first: "$$ROOT" },
        unread: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", mongoose.Types.ObjectId.createFromHexString(userId)] },
                  { $eq: ["$read", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  await Message.populate(messages, [
    { path: "_id", model: "User", select: "username avatar isOnline lastSeen" },
    { path: "lastMessage.sender", model: "User", select: "username avatar" },
  ]);

  return messages;
};

/**
 * Mark all unread messages from a sender as read.
 */
const markAsRead = async (senderId, receiverId) => {
  await Message.updateMany(
    { sender: senderId, receiver: receiverId, read: false },
    { read: true, readAt: new Date() }
  );
};

module.exports = { sendMessage, getConversation, getConversationList, markAsRead };
