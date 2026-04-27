import React from "react";
import { Text, View } from "react-native";

type Props = {
  streamURL: string;
  objectFit?: "cover" | "contain";
  className?: string;
  mirror?: boolean;
};

export const RTCVideoView: React.FC<Props> = () => {
  return (
    <View className="h-full w-full items-center justify-center bg-[#1C1C1E]">
      <Text className="text-[#8E8E93]">Video is available on native builds only</Text>
    </View>
  );
};
