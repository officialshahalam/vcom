import React from "react";
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect href={"/home" as never} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
