const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    text: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Message", messageSchema);
