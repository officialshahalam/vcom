import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { OtpInput } from "../../components/ui/OtpInput";
import { useAuthStore } from "../../stores/authStore";

export default function VerifyOtpScreen() {
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const params = useLocalSearchParams<{ userId?: string; type?: string }>();
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const submit = async (): Promise<void> => {
    const userId = Number(params.userId ?? "0");

    if (params.type === "RESET_PASSWORD") {
      // Don't call verifyOtp for password reset — the resetPassword endpoint
      // verifies the OTP itself. Calling verifyOtp here would mark it as used,
      // causing resetPassword to fail with "Invalid or expired OTP".
      router.replace({ pathname: "/reset-password", params: { userId: String(userId), otp } } as never);
      return;
    }

    await verifyOtp({ userId, otp });
    router.replace("/home" as never);
  };

  return (
    <View className="flex-1 bg-black px-6 pt-20">
      <Text className="text-2xl font-bold text-white">Verify OTP</Text>
      <Text className="mt-2 text-sm text-[#8E8E93]">Enter the 4-digit code sent to your mobile.</Text>

      <View className="mt-8">
        <OtpInput value={otp} onChange={setOtp} length={4} />
      </View>

      <Text className="mt-5 text-center text-[#8E8E93]">
        {seconds > 0 ? `Resend Code in 00:${String(seconds).padStart(2, "0")}` : "Resend Code"}
      </Text>

      <Pressable onPress={submit} className="mt-8 rounded-full bg-[#007AFF] py-4">
        <Text className="text-center font-semibold text-white">Verify</Text>
      </Pressable>
    </View>
  );
}
