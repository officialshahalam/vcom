import React from "react";
import { Text, View } from "react-native";

export const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <View className="my-2 items-center">
    <Text className="text-xs text-[#8E8E93]">{label}</Text>
  </View>
);
