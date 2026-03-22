import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useChatStore, Message } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import { useCallStore } from "@/store/call.store";

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <View
      className={`max-w-[78%] rounded-2xl px-4 py-2.5 mb-2 ${
        isOwn
          ? "bg-violet-600 self-end rounded-br-none"
          : "bg-gray-800 self-start rounded-bl-none"
      }`}
    >
      <Text className="text-white text-[15px]">{message.content}</Text>
      <Text className={`text-xs mt-1 ${isOwn ? "text-violet-300" : "text-gray-500"}`}>
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        {isOwn && (
          <Text className="ml-1 text-violet-300">{message.read ? " ✓✓" : " ✓"}</Text>
        )}
      </Text>
    </View>
  );
}

export default function ChatRoomScreen() {
  const { id, username } = useLocalSearchParams<{ id: string; username: string }>();
  const [text, setText] = useState("");
  const [isTyping, setIsTypingLocal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { messages, fetchMessages, sendMessage, setTyping, markRead, typingUsers, isLoading } =
    useChatStore();
  const { user } = useAuthStore();
  const { startCall } = useCallStore();
  const router = useRouter();

  const roomMessages = messages[id] ?? [];
  const partnerIsTyping = typingUsers[id] ?? false;

  useEffect(() => {
    if (id) {
      fetchMessages(id);
      markRead(id);
    }
  }, [id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (roomMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [roomMessages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !id) return;
    sendMessage(id, trimmed);
    setText("");
    setTyping(id, false);
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (value.length > 0 && !isTyping) {
      setIsTypingLocal(true);
      setTyping(id, true);
    } else if (value.length === 0 && isTyping) {
      setIsTypingLocal(false);
      setTyping(id, false);
    }
  };

  const handleCall = (type: "audio" | "video") => {
    startCall(id, username ?? "Unknown", type);
    router.push("/(main)/calls");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-violet-400 text-base">← Back</Text>
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-white font-semibold text-base">{username}</Text>
          {partnerIsTyping && (
            <Text className="text-green-400 text-xs">typing…</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleCall("audio")}
          className="bg-gray-800 w-9 h-9 rounded-full items-center justify-center mr-2"
        >
          <Text className="text-lg">📞</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleCall("video")}
          className="bg-gray-800 w-9 h-9 rounded-full items-center justify-center"
        >
          <Text className="text-lg">🎥</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {isLoading && roomMessages.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={roomMessages}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender._id === user?._id}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-sm">No messages yet. Say hi! 👋</Text>
            </View>
          }
          onEndReached={() => fetchMessages(id, Math.ceil(roomMessages.length / 30) + 1)}
          onEndReachedThreshold={0.2}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="flex-row items-end px-4 py-3 border-t border-gray-800">
          <TextInput
            className="flex-1 bg-gray-800 text-white rounded-2xl px-4 py-3 mr-2 text-base max-h-32"
            placeholder="Type a message…"
            placeholderTextColor="#6b7280"
            multiline
            value={text}
            onChangeText={handleTyping}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              text.trim() ? "bg-violet-600" : "bg-gray-700"
            }`}
          >
            <Text className="text-white text-base">➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
