import React, { useMemo, useRef } from "react";
import { Platform, TextInput, View } from "react-native";

type Props = {
  value: string;
  length?: number;
  onChange: (value: string) => void;
};

export const OtpInput: React.FC<Props> = ({ value, length = 4, onChange }) => {
  const hiddenRef = useRef<TextInput | null>(null);
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = useMemo(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    return arr;
  }, [length, value]);

  const handleHiddenChange = (text: string) => {
    const sanitized = text.replace(/\D/g, "").slice(0, length);
    onChange(sanitized);
    if (sanitized.length === length) {
      hiddenRef.current?.blur();
    }
  };

  return (
    <View className="flex-row justify-between gap-3">
      <TextInput
        ref={hiddenRef}
        value={value}
        onChangeText={handleHiddenChange}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        textContentType="oneTimeCode"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
        autoFocus
      />

      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            refs.current[index] = ref;
          }}
          className="h-14 w-14 rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] text-center text-xl font-semibold text-white"
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          autoComplete={index === 0 ? (Platform.OS === "android" ? "sms-otp" : "one-time-code") : "off"}
          textContentType={index === 0 ? "oneTimeCode" : "none"}
          onFocus={() => {
            if (Platform.OS === "android") {
              hiddenRef.current?.focus();
            }
          }}
          onChangeText={(next) => {
            const sanitized = next.replace(/\D/g, "");

            if (sanitized.length > 1) {
              onChange(sanitized.slice(0, length));
              refs.current[Math.min(sanitized.length, length) - 1]?.focus();
              return;
            }

            const chars = [...digits];
            chars[index] = sanitized;
            const merged = chars.join("").slice(0, length);
            onChange(merged);
            if (sanitized && index < length - 1) refs.current[index + 1]?.focus();
          }}
          onKeyPress={(event) => {
            if (event.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
        />
      ))}
    </View>
  );
};
