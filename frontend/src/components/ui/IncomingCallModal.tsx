import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
};

export const IncomingCallModal: React.FC<Props> = ({ visible, callerName, onAccept, onDecline }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full rounded-3xl bg-[#1C1C1E] p-6">
          <Text className="text-center text-xl font-bold text-white">Incoming Video Call</Text>
          <Text className="mt-2 text-center text-[#8E8E93]">{callerName}</Text>
          <View className="mt-6 flex-row justify-center gap-4">
            <Pressable onPress={onDecline} className="rounded-full bg-red-500 px-6 py-3">
              <Text className="font-semibold text-white">Decline</Text>
            </Pressable>
            <Pressable onPress={onAccept} className="rounded-full bg-green-500 px-6 py-3">
              <Text className="font-semibold text-white">Accept</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
