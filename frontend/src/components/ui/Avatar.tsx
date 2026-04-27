import React from "react";
import { Image, View } from "react-native";

type Props = {
  uri?: string | null;
  size?: number;
  online?: boolean;
};

export const Avatar: React.FC<Props> = ({ uri, size = 56, online = false }) => {
  return (
    <View>
      <Image
        source={uri ? { uri } : require("@/assets/images/icon.png")}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
      {online ? (
        <View
          className="absolute rounded-full border-2 border-white bg-[#34C759]"
          style={{ width: 10, height: 10, right: 2, bottom: 2 }}
        />
      ) : null}
    </View>
  );
};
