import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallStore } from "@/store/call.store";
import { useRouter } from "expo-router";

export default function CallsScreen() {
  const { status, remoteUsername, callType, acceptCall, rejectCall, endCall } =
    useCallStore();
  const router = useRouter();

  // ── Idle state ───────────────────────────────────────
  if (status === "idle" || status === "ended") {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="px-4 py-3 border-b border-gray-800">
          <Text className="text-white text-xl font-bold">Calls</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">📞</Text>
          <Text className="text-gray-400 text-base">
            {status === "ended" ? "Call ended" : "No active call"}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">
            Start a call from a chat conversation
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Calling / Connected / Incoming ───────────────────
  const isVideo = callType === "video";

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" />

      {/* Remote Video Placeholder */}
      <View className="flex-1 bg-gray-800 items-center justify-center">
        <View className="w-28 h-28 rounded-full bg-violet-700 items-center justify-center mb-4">
          <Text className="text-white text-5xl font-bold">
            {remoteUsername?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text className="text-white text-2xl font-semibold">{remoteUsername}</Text>
        <Text className="text-gray-400 mt-2 text-base">
          {status === "calling"
            ? `Calling… (${isVideo ? "Video" : "Audio"})`
            : status === "incoming"
            ? `Incoming ${isVideo ? "video" : "audio"} call`
            : `${isVideo ? "Video" : "Audio"} call in progress`}
        </Text>
      </View>

      {/* Self preview placeholder (video only) */}
      {isVideo && status === "connected" && (
        <View className="absolute top-12 right-4 w-24 h-36 bg-gray-700 rounded-xl items-center justify-center border-2 border-gray-600">
          <Text className="text-gray-400 text-xs">You</Text>
        </View>
      )}

      {/* Controls */}
      <SafeAreaView edges={["bottom"]} className="bg-gray-900 pb-2">
        <View className="flex-row justify-center items-center gap-6 py-6 space-x-6">
          {status === "incoming" ? (
            <>
              {/* Reject */}
              <TouchableOpacity
                onPress={() => {
                  rejectCall();
                  router.back();
                }}
                className="w-16 h-16 rounded-full bg-red-600 items-center justify-center"
              >
                <Text className="text-2xl">📵</Text>
              </TouchableOpacity>

              {/* Accept */}
              <TouchableOpacity
                onPress={acceptCall}
                className="w-16 h-16 rounded-full bg-green-600 items-center justify-center"
              >
                <Text className="text-2xl">📞</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Mute (placeholder) */}
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-700 items-center justify-center">
                <Text className="text-xl">🎙️</Text>
              </TouchableOpacity>

              {/* End call */}
              <TouchableOpacity
                onPress={() => {
                  endCall();
                  router.back();
                }}
                className="w-16 h-16 rounded-full bg-red-600 items-center justify-center"
              >
                <Text className="text-2xl">📵</Text>
              </TouchableOpacity>

              {/* Speaker (placeholder) */}
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-700 items-center justify-center">
                <Text className="text-xl">🔊</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
