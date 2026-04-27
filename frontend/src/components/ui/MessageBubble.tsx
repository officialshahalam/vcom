import React from "react";
import { Text, View } from "react-native";
import type { Message } from "../../types";

type Props = {
  message: Message;
  currentUserId?: number;
};

export const MessageBubble: React.FC<Props> = ({ message, currentUserId }) => {
  const isMine = message.senderId === currentUserId;
  return (
    <View className={`my-1 max-w-[80%] rounded-2xl px-3 py-2 ${isMine ? "self-end bg-[#007AFF]" : "self-start bg-[#1C1C1E]"}`}>
      <Text className="text-base text-white">{message.content}</Text>
      {isMine ? (
        <Text className="mt-1 self-end text-[10px] text-white/70">
          {message.readAt ? "✓✓" : message.deliveredAt ? "✓" : "⏱"}
        </Text>
      ) : null}
    </View>
  );
};
