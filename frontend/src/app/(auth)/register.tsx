import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    try {
      await register(username.trim(), email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      Alert.alert("Registration Failed", message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="px-6">
          {/* Header */}
          <View className="mb-10 items-center">
            <Text className="text-4xl font-bold text-white tracking-widest">VCOM</Text>
            <Text className="text-gray-400 mt-2 text-base">Create your account</Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <TextInput
              className="bg-gray-800 text-white rounded-xl px-4 py-4 text-base mb-4"
              placeholder="Username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <TextInput
              className="bg-gray-800 text-white rounded-xl px-4 py-4 text-base mb-4"
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              className="bg-gray-800 text-white rounded-xl px-4 py-4 text-base mb-6"
              placeholder="Password (min 6 chars)"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              className="bg-violet-600 rounded-xl py-4 items-center"
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-8 mb-4">
            <Text className="text-gray-400">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-violet-400 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
