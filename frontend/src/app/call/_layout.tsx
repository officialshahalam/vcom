import React from "react";
import { Stack } from "expo-router";
import { AuthGuard } from "../../components/auth/AuthGuard";

export default function CallLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGuard>
  );
}
