import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { User } from "@/store/auth.store";

export default function ContactsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchUsers = async (query?: string) => {
    setIsLoading(true);
    try {
      const endpoint = query ? `/users?search=${encodeURIComponent(query)}` : "/users";
      const res = await api.get<{ users: User[] }>(endpoint);
      setUsers(res.users);
    } catch (err) {
      console.error("[Contacts] fetchUsers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchUsers(value);
  };

  const openChat = (user: User) => {
    router.push({
      pathname: "/(main)/chat/[id]",
      params: { id: user._id, username: user.username },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800">
        <Text className="text-white text-xl font-bold mb-3">Contacts</Text>
        <TextInput
          className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base"
          placeholder="Search users…"
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center px-4 py-3 border-b border-gray-800"
              onPress={() => openChat(item)}
            >
              <View className="w-11 h-11 rounded-full bg-violet-700 items-center justify-center mr-3">
                <Text className="text-white text-lg font-bold">
                  {item.username.charAt(0).toUpperCase()}
                </Text>
                {item.isOnline && (
                  <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-950" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">{item.username}</Text>
                <Text className="text-gray-500 text-xs">
                  {item.isOnline ? "Online" : "Offline"}
                </Text>
              </View>
              <Text className="text-gray-500 text-xl">💬</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-sm">No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
