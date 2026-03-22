import mongoose, { Document, Schema } from "mongoose";

export type MessageType = "text" | "image" | "file" | "system";

export interface IMessage extends Document {
  messageId: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
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

export default mongoose.model<IMessage>("Message", messageSchema);
