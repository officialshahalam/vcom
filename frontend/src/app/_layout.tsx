import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";
import { useAuthStore } from "@/store/auth.store";
import { socketService } from "@/services/socket";
import { useChatStore } from "@/store/chat.store";
import { useCallStore } from "@/store/call.store";

export default function RootLayout() {
  const { user, token } = useAuthStore();
  const addIncoming = useChatStore((s) => s.addIncomingMessage);
  const setTypingStatus = useChatStore((s) => s.setTypingStatus);
  const setIncomingCall = useCallStore((s) => s.setIncoming);
  const setAnswer = useCallStore((s) => s.setAnswer);
  const addIce = useCallStore((s) => s.addIceCandidate);
  const endCall = useCallStore((s) => s.endCall);
  const router = useRouter();
  const segments = useSegments();

  // Redirect based on auth state
  useEffect(() => {
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(main)/chat");
    }
  }, [user, segments]);

  // Register WebSocket event handlers
  useEffect(() => {
    if (!token) return;

    const handleReceive = (data: Record<string, unknown>) => {
      addIncoming(data.message as Parameters<typeof addIncoming>[0]);
    };

    const handleTyping = (data: Record<string, unknown>) => {
      setTypingStatus(data.senderId as string, data.isTyping as boolean);
    };

    const handleIncomingCall = (data: Record<string, unknown>) => {
      setIncomingCall(
        data.callerId as string,
        (data.callerName as string) ?? "Unknown",
        data.offer,
        (data.callType as "audio" | "video") ?? "video"
      );
      router.push("/(main)/calls");
    };

    const handleAnswer = (data: Record<string, unknown>) => setAnswer(data.answer);
    const handleIce = (data: Record<string, unknown>) => addIce(data.candidate);
    const handleEnded = () => endCall();

    socketService.on("chat:receive", handleReceive);
    socketService.on("chat:typing", handleTyping);
    socketService.on("call:incoming", handleIncomingCall);
    socketService.on("call:answer", handleAnswer);
    socketService.on("call:ice-candidate", handleIce);
    socketService.on("call:ended", handleEnded);

    return () => {
      socketService.off("chat:receive", handleReceive);
      socketService.off("chat:typing", handleTyping);
      socketService.off("call:incoming", handleIncomingCall);
      socketService.off("call:answer", handleAnswer);
      socketService.off("call:ice-candidate", handleIce);
      socketService.off("call:ended", handleEnded);
    };
  }, [token]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}
