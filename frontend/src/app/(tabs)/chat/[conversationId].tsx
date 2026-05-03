import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View, Animated, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../../stores/authStore";
import { useCallStore } from "../../../stores/callStore";
import { useChatStore } from "../../../stores/chatStore";
import { MessageList } from "../../../components/chat/MessageList";
import { ChatInput } from "../../../components/chat/ChatInput";
import { Avatar } from "../../../components/ui/Avatar";
import { useWebSocketStore } from "../../../stores/webSocketStore";
import { WS_EVENTS } from "../../../constants";

const formatLastSeen = (lastSeen: string, isOnline: boolean): string => {
  if (isOnline) return "Active now";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `Active ${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `Last seen today at ${new Date(lastSeen).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (diff < 172800000) return "Last seen yesterday";
  return `Last seen ${new Date(lastSeen).toLocaleDateString([], { month: "short", day: "numeric" })}`;
};

export default function ChatConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const conversations = useChatStore((state) => state.conversations);
  const messagesMap = useChatStore((state) => state.messages);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const sendWs = useWebSocketStore((state) => state.send);

  const [text, setText] = useState("");
  const [isVideoButtonPressed, setIsVideoButtonPressed] = useState(false);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return;
      setActiveConversation(conversationId);
      void loadMessages(conversationId, 1);
      void markAsRead(conversationId);
      return () => setActiveConversation(null);
    }, [conversationId, loadMessages, markAsRead, setActiveConversation]),
  );

  const conversation = useMemo(
    () => conversations.find((item) => String(item.id) === String(conversationId)),
    [conversationId, conversations],
  );
  const otherUser = conversation?.participants.find((item) => item.user.id !== user?.id)?.user;

  // If the conversation wasn't in the store (e.g. user deep-linked to /chat/:id),
  // lazy-fetch the list so the header can render name + avatar.
  useEffect(() => {
    if (!conversationId) return;
    if (!conversation) void loadConversations();
  }, [conversation, conversationId, loadConversations]);

  const send = async (): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || !conversationId) return;

    setText("");
    // Clear typing timers and send TYPING_STOP immediately on send.
    if (typingThrottleRef.current) { clearTimeout(typingThrottleRef.current); typingThrottleRef.current = null; }
    if (typingStopRef.current) { clearTimeout(typingStopRef.current); typingStopRef.current = null; }
    sendWs(WS_EVENTS.TYPING_STOP, { conversationId: Number(conversationId) });

    await sendMessage(conversationId, trimmed);
  };

  const sendTyping = (value: string): void => {
    setText(value);
    if (!conversationId) return;

    // Throttle TYPING_START to once every 2 seconds.
    if (!typingThrottleRef.current) {
      sendWs(WS_EVENTS.TYPING_START, { conversationId: Number(conversationId) });
      typingThrottleRef.current = setTimeout(() => {
        typingThrottleRef.current = null;
      }, 2000);
    }

    // Send TYPING_STOP after 2 seconds of no typing.
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => {
      sendWs(WS_EVENTS.TYPING_STOP, { conversationId: Number(conversationId) });
      typingStopRef.current = null;
    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-black pt-12">
        <View className="flex-row items-center px-4 pb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" color="#fff" size={22} />
          </Pressable>

          {otherUser ? (
            <View className="mr-3">
              <Avatar uri={otherUser.profilePicture} size={40} online={otherUser.isOnline} />
            </View>
          ) : null}

          <View className="flex-1">
            <Text className="text-base font-semibold text-white">{otherUser?.fullName ?? "Chat"}</Text>
            <Text className="text-xs text-[#8E8E93]">{otherUser ? formatLastSeen(otherUser.lastSeen, otherUser.isOnline) : ""}</Text>
          </View>

          <Pressable
            onPress={() => {
              if (!otherUser) return;
              useCallStore.getState().startCall({
                userId: otherUser.id,
                fullName: otherUser.fullName,
                profilePicture: otherUser.profilePicture,
              });
            }}
            onPressIn={() => setIsVideoButtonPressed(true)}
            onPressOut={() => setIsVideoButtonPressed(false)}
            style={{
              opacity: isVideoButtonPressed ? 0.6 : 1,
              transform: [{ scale: isVideoButtonPressed ? 0.95 : 1 }],
            }}
          >
            <Ionicons name="videocam-outline" color="#fff" size={22} />
          </Pressable>
        </View>

        <MessageList messages={messagesMap[String(conversationId)] ?? []} currentUserId={user?.id} />

        <ChatInput value={text} onChangeText={sendTyping} onSend={send} />
      </View>
    </KeyboardAvoidingView>
  );
}
