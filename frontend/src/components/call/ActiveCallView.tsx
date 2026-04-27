import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui/Avatar";
import { VideoView } from "./VideoView";
import { useCallStore } from "../../stores/callStore";
import { useWebSocketStore } from "../../stores/webSocketStore";
import { WS_EVENTS } from "../../constants";

export const ActiveCallView: React.FC = () => {
  const status = useCallStore((s) => s.status);
  const peer = useCallStore((s) => s.peer);
  const callId = useCallStore((s) => s.callId);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const endCall = useCallStore((s) => s.endCall);

  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const visible = status === "calling" || status === "active";
  const isConnecting = status === "calling" || !remoteStream;

  // Reset toggle state whenever a new call begins or the previous one ends.
  useEffect(() => {
    if (status === "idle") {
      setMuted(false);
      setVideoOff(false);
    }
  }, [status]);

  const handleEnd = (): void => {
    if (callId) {
      useWebSocketStore.getState().send(WS_EVENTS.CALL_END, { callId });
    }
    endCall();
  };

  const toggleMute = (): void => {
    if (!localStream) return;
    const nextMuted = !muted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMuted(nextMuted);
  };

  const toggleVideo = (): void => {
    if (!localStream) return;
    const nextOff = !videoOff;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !nextOff;
    });
    setVideoOff(nextOff);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleEnd}>
      <View className="flex-1 bg-black">
        {/* Remote stream — fills the screen. */}
        <View className="flex-1">
          {remoteStream ? (
            <VideoView stream={remoteStream} />
          ) : (
            <View className="flex-1 items-center justify-center bg-[#0A0A0A]">
              <Avatar uri={peer?.profilePicture} size={140} />
              <Text className="mt-6 text-2xl font-bold text-white">{peer?.fullName ?? "Calling..."}</Text>
              <Text className="mt-2 text-sm text-[#8E8E93]">
                {isConnecting ? "Connecting..." : "Call in progress"}
              </Text>
            </View>
          )}
        </View>

        {/* Local preview — small overlay in the corner. */}
        {localStream ? (
          <View
            className="absolute right-4 top-10 overflow-hidden rounded-2xl border border-white/20"
            style={{ width: 120, height: 160 }}
          >
            <VideoView stream={localStream} muted mirror />
          </View>
        ) : null}

        {/* Call controls. */}
        <View className="absolute bottom-10 left-0 right-0 flex-row items-center justify-center gap-6">
          <Pressable
            onPress={toggleMute}
            disabled={!localStream}
            className={`h-14 w-14 items-center justify-center rounded-full ${
              muted ? "bg-white" : "bg-[#2C2C2E]"
            }`}
          >
            <Ionicons name={muted ? "mic-off" : "mic"} color={muted ? "#000" : "#fff"} size={22} />
          </Pressable>

          <Pressable
            onPress={handleEnd}
            className="h-16 w-16 items-center justify-center rounded-full bg-[#FF3B30]"
          >
            <Ionicons name="call" color="#fff" size={26} style={{ transform: [{ rotate: "135deg" }] }} />
          </Pressable>

          <Pressable
            onPress={toggleVideo}
            disabled={!localStream}
            className={`h-14 w-14 items-center justify-center rounded-full ${
              videoOff ? "bg-white" : "bg-[#2C2C2E]"
            }`}
          >
            <Ionicons
              name={videoOff ? "videocam-off" : "videocam"}
              color={videoOff ? "#000" : "#fff"}
              size={22}
            />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
