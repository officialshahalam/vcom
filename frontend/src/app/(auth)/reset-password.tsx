import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { PasswordStrengthBar } from "../../components/ui/PasswordStrengthBar";
import { authService } from "../../services/authService";

type Form = { newPassword: string; confirmPassword: string };

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ userId?: string; otp?: string }>();
  const { control, watch, handleSubmit } = useForm<Form>({ defaultValues: { newPassword: "", confirmPassword: "" } });
  const password = watch("newPassword");

  const submit = handleSubmit(async (values) => {
    await authService.resetPassword({
      userId: Number(params.userId ?? "0"),
      otp: String(params.otp ?? ""),
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });
    router.replace("/login" as never);
  });

  return (
    <View className="flex-1 bg-black px-6 pt-20">
      <Text className="text-2xl font-bold text-white">Create New Password</Text>
      <Text className="mt-2 text-sm text-[#8E8E93]">Use a strong password with uppercase and numbers.</Text>

      <Controller
        control={control}
        name="newPassword"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            secureTextEntry
            placeholder="New Password"
            placeholderTextColor="#8E8E93"
            className="mt-8 rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] px-4 py-4 text-white"
          />
        )}
      />

      <PasswordStrengthBar password={password} />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            secureTextEntry
            placeholder="Confirm Password"
            placeholderTextColor="#8E8E93"
            className="mt-6 rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] px-4 py-4 text-white"
          />
        )}
      />

      <Text className="mt-2 text-xs text-[#8E8E93]">Both passwords must match</Text>

      <Pressable onPress={submit} className="mt-8 rounded-full bg-[#007AFF] py-4">
        <Text className="text-center font-semibold text-white">Reset Password</Text>
      </Pressable>
    </View>
  );
}
