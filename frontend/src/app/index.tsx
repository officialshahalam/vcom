import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) return null;

  return <Redirect href={(isAuthenticated ? "/home" : "/login") as never} />;
}
