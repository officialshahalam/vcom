import React, { useEffect } from "react";
import { Stack } from "expo-router";
import "../global.css";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuthStore } from "../stores/authStore";
import { CallOverlay } from "../components/call/CallOverlay";

export default function RootLayout() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  useWebSocket();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="call" />
      </Stack>
      <CallOverlay />
    </>
  );
}
