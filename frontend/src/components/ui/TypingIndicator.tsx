import React from "react";
import { Text, View } from "react-native";

export const TypingIndicator: React.FC = () => {
  return (
    <View className="self-start rounded-2xl bg-[#1C1C1E] px-3 py-2">
      <Text className="text-xs text-[#8E8E93]">typing...</Text>
    </View>
  );
};
