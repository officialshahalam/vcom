import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../stores/authStore";

const schema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 chars and use letters, numbers, or _"),
    mobileNumber: z.string().min(8, "Mobile number must be at least 8 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  });

type Form = z.infer<typeof schema>;

export default function SignupScreen() {
  const signup = useAuthStore((state) => state.signup);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      username: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await signup(values);
    router.push({ pathname: "/verify-otp", params: { userId: String(result.userId), type: "SIGNUP" } } as never);
  });

  return (
    <KeyboardAvoidingView className="flex-1 bg-black px-6" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text className="mt-16 text-2xl font-bold text-white">Create Account</Text>
      <View className="mt-8 gap-4">
        {(["fullName", "username", "mobileNumber", "password", "confirmPassword"] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field: { value, onChange } }) => (
              <View>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={/password/i.test(name)}
                  keyboardType={name === "mobileNumber" ? "phone-pad" : "default"}
                  placeholder={
                    name === "fullName"
                      ? "Full Name"
                      : name === "mobileNumber"
                        ? "Mobile Number"
                        : name === "confirmPassword"
                          ? "Confirm Password"
                          : name[0].toUpperCase() + name.slice(1)
                  }
                  placeholderTextColor="#8E8E93"
                  className="rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] px-4 py-4 text-white"
                />
                {(errors as Record<string, { message?: string } | undefined>)[name]?.message ? (
                  <Text className="mt-1 text-xs text-red-400">{(errors as Record<string, { message?: string } | undefined>)[name]?.message}</Text>
                ) : null}
              </View>
            )}
          />
        ))}

        <Pressable onPress={onSubmit} className="rounded-full bg-[#007AFF] py-4">
          <Text className="text-center font-semibold text-white">Sign Up</Text>
        </Pressable>
      </View>

      <View className="mt-auto mb-10 flex-row justify-center">
        <Text className="text-[#8E8E93]">Already have an account? </Text>
        <Link href={"/login" as never} asChild>
          <Pressable>
            <Text className="font-semibold text-white">Log In</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
