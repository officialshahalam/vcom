import React from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { useAuthStore } from "../../stores/authStore";

const schema = z.object({
  mobileNumber: z.string().min(8, "Mobile number must be at least 8 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Form = z.infer<typeof schema>;

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { mobileNumber: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      router.replace("/home" as never);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string; data?: { message?: string } }>;
      const apiMessage =
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        axiosError.response?.data?.data?.message;

      Alert.alert("Login Failed", apiMessage ?? "Invalid credentials");
    }
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black px-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={40}
    >
      <View className="mt-20">
        <Text className="text-4xl font-bold text-white">Welcome Back</Text>
        <Text className="mt-2 text-sm text-[#8E8E93]">Please sign in to your account.</Text>
      </View>

      <View className="mt-10 gap-4">
        <Controller
          control={control}
          name="mobileNumber"
          render={({ field: { value, onChange } }) => (
            <View>
              <View className="flex-row items-center rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] px-4 py-4">
                <Ionicons name="call-outline" size={18} color="#8E8E93" />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  placeholder="Mobile Number"
                  placeholderTextColor="#8E8E93"
                  className="ml-3 flex-1 text-white"
                />
              </View>
              {errors.mobileNumber ? <Text className="mt-1 text-xs text-red-400">{errors.mobileNumber.message}</Text> : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange } }) => (
            <View>
              <View className="flex-row items-center rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] px-4 py-4">
                <Ionicons name="lock-closed-outline" size={18} color="#8E8E93" />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  placeholder="Password"
                  placeholderTextColor="#8E8E93"
                  className="ml-3 flex-1 text-white"
                />
              </View>
              {errors.password ? <Text className="mt-1 text-xs text-red-400">{errors.password.message}</Text> : null}
            </View>
          )}
        />

        <Link href={"/forgot-password" as never} asChild>
          <Pressable>
            <Text className="self-end text-sm text-white">Forgot Password?</Text>
          </Pressable>
        </Link>

        <Pressable onPress={onSubmit} disabled={isLoading} className="overflow-hidden rounded-full">
          <LinearGradient colors={["#FF6B6B", "#FF4757"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View className="items-center py-4">
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Login</Text>}
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      <View className="mt-auto mb-10 flex-row justify-center">
        <Text className="text-[#8E8E93]">Don&apos;t have an account? </Text>
        <Link href={"/signup" as never} asChild>
          <Pressable>
            <Text className="font-semibold text-white">Sign Up</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
