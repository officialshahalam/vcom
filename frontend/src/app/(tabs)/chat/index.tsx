import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../../stores/authStore";
import { useChatStore } from "../../../stores/chatStore";
import { ConversationItem } from "../../../components/chat/ConversationItem";
import { userService } from "../../../services/userService";
import { chatService } from "../../../services/chatService";
import type { User } from "../../../types";

const SearchResultItem: React.FC<{ user: User; onPress: () => void }> = ({ user, onPress }) => {
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3">
      <View className="h-14 w-14 overflow-hidden rounded-full bg-[#1C1C1E]">
        {user.profilePicture ? <Image source={{ uri: user.profilePicture }} className="h-full w-full" /> : null}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-white">{user.fullName}</Text>
        <Text className="mt-1 text-sm text-[#8E8E93]">@{user.username}</Text>
      </View>
      <Ionicons name="chevron-forward" color="#8E8E93" size={18} />
    </Pressable>
  );
};

export default function ChatListScreen() {
  const user = useAuthStore((state) => state.user);
  const conversations = useChatStore((state) => state.conversations);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await loadConversations();
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((item) => {
      const other = item.participants.find((p) => p.user.id !== user?.id)?.user;
      return `${other?.fullName ?? ""} ${other?.username ?? ""}`.toLowerCase().includes(q);
    });
  }, [conversations, query, user?.id]);

  useEffect(() => {
    const q = query.trim();

    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await userService.search(q);
        setSearchResults(response.data.data as User[]);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const openConversation = async (participantId: number): Promise<void> => {
    const response = await chatService.getOrCreateConversation(participantId);
    const conversation = response.data.data as { id: number };
    await loadConversations();
    router.push({ pathname: "/chat/[conversationId]", params: { conversationId: String(conversation.id) } } as never);
  };

  return (
    <View className="flex-1 bg-black pt-14">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-2xl font-bold text-white">Us</Text>
        <Ionicons name="create-outline" color="#fff" size={22} />
      </View>

      <View className="mx-4 mt-4 flex-row items-center rounded-xl bg-[#1C1C1E] px-3 py-3">
        <Ionicons name="search" color="#8E8E93" size={16} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor="#8E8E93"
          className="ml-2 flex-1 text-white"
        />
      </View>

      {query.trim() ? (
        <FlatList
          className="mt-2"
          data={searchResults}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View className="px-4 py-6">
              <Text className="text-sm text-[#8E8E93]">{searching ? "Searching..." : "No users found"}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <SearchResultItem user={item} onPress={() => void openConversation(item.id)} />
          )}
        />
      ) : (
        <FlatList
          className="mt-2"
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              currentUserId={user?.id}
              onPress={() =>
                router.push({ pathname: "/chat/[conversationId]", params: { conversationId: String(item.id) } } as never)
              }
            />
          )}
        />
      )}

    </View>
  );
}
