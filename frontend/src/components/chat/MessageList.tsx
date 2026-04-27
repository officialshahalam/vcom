import React, { useEffect, useRef } from "react";
import { FlatList, View } from "react-native";
import type { Message } from "../../types";
import { MessageBubble } from "../ui/MessageBubble";

type Props = {
  messages: Message[];
  currentUserId?: number;
  onEndReached?: () => void;
};

export const MessageList: React.FC<Props> = ({ messages, currentUserId, onEndReached }) => {
  const listRef = useRef<FlatList<Message>>(null);

  // Auto-scroll to the newest message whenever the list grows or mounts.
  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <MessageBubble message={item} currentUserId={currentUserId} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.2}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      ListFooterComponent={<View className="h-4" />}
    />
  );
};
