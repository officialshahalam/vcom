import React, { useState } from "react";
import { Modal, Pressable, Share, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../components/ui/Avatar";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEdit = (): void => {
    setFullName(user?.fullName ?? "");
    setUsername(user?.username ?? "");
    setBio(user?.bio ?? "");
    setProfilePicture(user?.profilePicture ?? "");
    setError(null);
    setEditOpen(true);
  };

  const saveEdit = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        fullName: fullName.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        profilePicture: profilePicture.trim() ? profilePicture.trim() : null,
      });
      setEditOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const doShare = async (): Promise<void> => {
    await Share.share({ message: `https://us.app/u/${user?.username ?? "profile"}` });
  };

  const doLogout = async (): Promise<void> => {
    await logout();
    router.replace("/login" as never);
  };

  return (
    <View className="flex-1 items-center bg-black px-6 pt-14">
      <View className="w-full flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="lock-closed-outline" color="#fff" size={16} />
          <Text className="font-semibold text-white">@{user?.username}</Text>
        </View>
        <Ionicons name="menu" color="#fff" size={22} />
      </View>

      <View className="mt-10 items-center">
        <Avatar uri={user?.profilePicture} size={120} online={user?.isOnline} />
        <Text className="mt-4 text-xl font-bold text-white">{user?.fullName ?? "Profile"}</Text>
        <Text className="mt-2 text-center text-sm text-[#8E8E93]">{user?.bio ?? "No bio yet"}</Text>
      </View>

      <View className="mt-8 flex-row gap-3">
        <Pressable onPress={openEdit} className="rounded-full bg-[#1C1C1E] px-4 py-3">
          <Text className="text-white">Edit Profile</Text>
        </Pressable>
        <Pressable onPress={doShare} className="rounded-full bg-[#1C1C1E] px-4 py-3">
          <Text className="text-white">Share Profile</Text>
        </Pressable>
        <Pressable onPress={doLogout} className="rounded-full bg-[#1C1C1E] px-4 py-3">
          <Text className="text-white">Logout</Text>
        </Pressable>
      </View>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <Pressable className="flex-1 justify-center bg-black/70 px-6" onPress={() => setEditOpen(false)}>
          <Pressable
            onPress={() => {
              /* swallow tap so backdrop doesn't close modal */
            }}
            className="rounded-2xl bg-[#1C1C1E] p-5"
          >
            <Text className="text-lg font-bold text-white">Edit Profile</Text>

            <View className="mt-4 items-center">
              <Avatar uri={profilePicture || user?.profilePicture} size={88} />
            </View>

            <Text className="mt-4 text-xs text-[#8E8E93]">Profile picture URL</Text>
            <TextInput
              value={profilePicture}
              onChangeText={setProfilePicture}
              placeholder="https://..."
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-1 rounded-xl bg-[#2C2C2E] px-3 py-3 text-white"
            />

            <Text className="mt-3 text-xs text-[#8E8E93]">Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor="#8E8E93"
              className="mt-1 rounded-xl bg-[#2C2C2E] px-3 py-3 text-white"
            />

            <Text className="mt-3 text-xs text-[#8E8E93]">Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-1 rounded-xl bg-[#2C2C2E] px-3 py-3 text-white"
            />

            <Text className="mt-3 text-xs text-[#8E8E93]">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor="#8E8E93"
              multiline
              className="mt-1 rounded-xl bg-[#2C2C2E] px-3 py-3 text-white"
            />

            {error ? <Text className="mt-3 text-sm text-red-400">{error}</Text> : null}

            <View className="mt-5 flex-row justify-end gap-3">
              <Pressable onPress={() => setEditOpen(false)} className="rounded-full bg-[#2C2C2E] px-4 py-3">
                <Text className="text-white">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveEdit}
                disabled={saving}
                className={`rounded-full px-4 py-3 ${saving ? "bg-[#2C2C2E]" : "bg-[#007AFF]"}`}
              >
                <Text className="font-semibold text-white">{saving ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
