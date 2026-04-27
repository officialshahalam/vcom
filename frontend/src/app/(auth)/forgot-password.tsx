import React from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { authService } from "../../services/authService";

type Form = { mobileNumber: string };

export default function ForgotPasswordScreen() {
  const { control, handleSubmit } = useForm<Form>({ defaultValues: { mobileNumber: "" } });

  const submit = handleSubmit(async (values) => {
    const response = await authService.forgotPassword(values);
    const userId = response.data?.data?.userId as number;
    Alert.alert("OTP Sent", "Check your mobile for OTP");
    router.push({ pathname: "/verify-otp", params: { userId: String(userId), type: "RESET_PASSWORD" } } as never);
  });

  return (
    <View className="flex-1 bg-black px-6 pt-20">
      <Text className="text-2xl font-bold text-white">Forgot Password</Text>
      <Text className="mt-2 text-sm text-[#8E8E93]">Enter your mobile number to receive OTP.</Text>

      <Controller
        control={control}
        name="mobileNumber"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="phone-pad"
            placeholder="Mobile Number"
            placeholderTextColor="#8E8E93"
            className="mt-8 rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] px-4 py-4 text-white"
          />
        )}
      />

      <Pressable onPress={submit} className="mt-8 rounded-full bg-[#007AFF] py-4">
        <Text className="text-center font-semibold text-white">Send OTP</Text>
      </Pressable>
    </View>
  );
}
