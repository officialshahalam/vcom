import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  onAllow,
  onDeny,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDeny}
    >
      <View className="flex-1 bg-black/70 justify-center items-center px-4">
        <View className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-sm">
          {/* Icon */}
          <View className="items-center mb-4">
            <View className="bg-[#007AFF] rounded-full p-4 mb-3">
              <Ionicons name="videocam" color="#fff" size={32} />
            </View>
          </View>

          {/* Title */}
          <Text className="text-white text-xl font-semibold text-center mb-2">
            Enable Camera & Microphone
          </Text>

          {/* Description */}
          <Text className="text-[#8E8E93] text-center mb-6">
            This app needs access to your camera and microphone to make video calls.
          </Text>

          {/* Buttons */}
          <View className="gap-3">
            <Pressable
              onPress={onAllow}
              className="bg-[#007AFF] rounded-lg py-3 px-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Allow</Text>
            </Pressable>

            <Pressable
              onPress={onDeny}
              className="bg-[#3A3A3C] rounded-lg py-3 px-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Not now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
