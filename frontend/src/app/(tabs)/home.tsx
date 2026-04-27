import React from "react";
import { Image, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-black">
      <Image
        source={{ uri: "https://ik.imagekit.io/aalam855/vCom/homePage.png" }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
  );
}
