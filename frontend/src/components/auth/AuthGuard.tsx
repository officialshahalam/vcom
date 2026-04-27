import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

type Props = { children: React.ReactNode };

export const AuthGuard: React.FC<Props> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href={"/login" as never} />;

  return <>{children}</>;
};
