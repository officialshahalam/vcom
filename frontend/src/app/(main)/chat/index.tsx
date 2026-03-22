import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useChatStore, Conversation } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";

function ConversationItem({ item }: { item: Conversation }) {
  const router = useRouter();
  const partner = item._id;
  const lastMsg = item.lastMessage;

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-800"
      onPress={() =>
        router.push({
          pathname: "/(main)/chat/[id]",
          params: { id: partner._id, username: partner.username },
        })
      }
    >
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-violet-700 items-center justify-center mr-3">
        <Text className="text-white text-lg font-bold">
          {partner.username.charAt(0).toUpperCase()}
        </Text>
        {partner.isOnline && (
          <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-950" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row justify-between">
          <Text className="text-white font-semibold text-base">{partner.username}</Text>
          {lastMsg && (
            <Text className="text-gray-500 text-xs">
              {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
        <View className="flex-row justify-between mt-0.5">
          <Text className="text-gray-400 text-sm flex-1 mr-2" numberOfLines={1}>
            {lastMsg?.content ?? "Start a conversation"}
          </Text>
          {item.unread > 0 && (
            <View className="bg-violet-600 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-bold">{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatListScreen() {
  const { conversations, fetchConversations, isLoading } = useChatStore();
  const { logout, user } = useAuthStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <Text className="text-white text-xl font-bold">Chats</Text>
        <View className="flex-row items-center space-x-3">
          <Text className="text-gray-400 text-sm">{user?.username}</Text>
          <TouchableOpacity
            onPress={logout}
            className="bg-gray-800 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-red-400 text-sm">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" size="large" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl mb-3">💬</Text>
          <Text className="text-gray-400 text-base">No conversations yet</Text>
          <Text className="text-gray-600 text-sm mt-1">
            Go to Contacts to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id._id}
          renderItem={({ item }) => <ConversationItem item={item} />}
          onRefresh={fetchConversations}
          refreshing={isLoading}
        />
      )}
    </SafeAreaView>
  );
}
