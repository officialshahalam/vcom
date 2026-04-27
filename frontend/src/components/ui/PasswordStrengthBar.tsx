import React from "react";
import { Text, View } from "react-native";

export function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return "weak";
  if (score <= 2) return "medium";
  return "strong";
}

export const PasswordStrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const strength = getPasswordStrength(password);
  const active = strength === "weak" ? 1 : strength === "medium" ? 2 : 3;

  return (
    <View className="mt-3">
      <View className="mb-2 flex-row gap-2">
        <View className={`h-2 flex-1 rounded-full ${active >= 1 ? "bg-red-500" : "bg-[#2C2C2E]"}`} />
        <View className={`h-2 flex-1 rounded-full ${active >= 2 ? "bg-orange-400" : "bg-[#2C2C2E]"}`} />
        <View className={`h-2 flex-1 rounded-full ${active >= 3 ? "bg-green-500" : "bg-[#2C2C2E]"}`} />
      </View>
      <Text className="text-sm text-[#8E8E93]">Password Strength: {strength[0].toUpperCase() + strength.slice(1)}</Text>
    </View>
  );
};
