import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Conversation } from "../../types";
import { Avatar } from "../ui/Avatar";

type Props = {
  conversation: Conversation;
  currentUserId?: number;
  onPress: () => void;
};

const getTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m`;

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const ConversationItem: React.FC<Props> = ({ conversation, currentUserId, onPress }) => {
  const other = conversation.participants.find((item) => item.user.id !== currentUserId)?.user;
  const lastMessage = conversation.messages[0];

  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3">
      <Avatar uri={other?.profilePicture} size={56} online={other?.isOnline} />
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-white">{other?.fullName ?? "Unknown"}</Text>
        <Text className="mt-1 text-sm text-[#8E8E93]" numberOfLines={1}>
          {lastMessage?.senderId === currentUserId ? "You: " : ""}
          {lastMessage?.content ?? "No messages yet"}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-xs text-[#8E8E93]">{lastMessage ? getTimestamp(lastMessage.sentAt) : ""}</Text>
        {conversation.unreadCount === 1 ? <View className="mt-2 h-2 w-2 rounded-full bg-[#007AFF]" /> : null}
        {conversation.unreadCount > 1 ? (
          <View className="mt-2 min-w-5 rounded-full bg-[#007AFF] px-1 py-0.5">
            <Text className="text-center text-xs text-white">{conversation.unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};
