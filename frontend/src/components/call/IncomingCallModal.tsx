import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui/Avatar";
import { useCallStore } from "../../stores/callStore";
import { useWebSocketStore } from "../../stores/webSocketStore";
import { WS_EVENTS } from "../../constants";

export const IncomingCallModal: React.FC = () => {
  const status = useCallStore((s) => s.status);
  const peer = useCallStore((s) => s.peer);
  const callId = useCallStore((s) => s.callId);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const rejectCall = useCallStore((s) => s.rejectCall);

  const visible = status === "ringing";

  const handleAccept = (): void => {
    acceptCall();
  };

  const handleReject = (): void => {
    if (callId) {
      useWebSocketStore.getState().send("CALL_REJECT", { callId });
    }
    rejectCall();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleReject}>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-md rounded-3xl bg-[#1C1C1E] px-6 py-10">
          <View className="items-center">
            <Avatar uri={peer?.profilePicture} size={130} />
            <Text className="mt-6 text-2xl font-bold text-white">{peer?.fullName ?? "Incoming call"}</Text>
            <Text className="mt-2 text-sm text-[#8E8E93]">Incoming video call...</Text>
          </View>

          <View className="mt-10 flex-row items-center justify-center gap-14">
            <Pressable
              onPress={handleReject}
              className="h-16 w-16 items-center justify-center rounded-full bg-[#FF3B30]"
            >
              <Ionicons name="close" color="#fff" size={30} />
            </Pressable>
            <Pressable
              onPress={handleAccept}
              className="h-16 w-16 items-center justify-center rounded-full bg-[#34C759]"
            >
              <Ionicons name="videocam" color="#fff" size={26} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
