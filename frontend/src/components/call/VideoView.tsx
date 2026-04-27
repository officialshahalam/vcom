import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";

type Props = {
  stream: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  style?: React.CSSProperties;
};

/**
 * Web-only video element wrapper. On React Native Web this renders a plain
 * <video> DOM element via React (react-native-web passes unknown intrinsic
 * elements through). On native builds it degrades to an empty <View>.
 */
export const VideoView: React.FC<Props> = ({ stream, muted = false, mirror = false, style }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (node.srcObject !== stream) {
      node.srcObject = stream;
    }
  }, [stream]);

  if (Platform.OS !== "web") {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  return React.createElement("video", {
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: mirror ? "scaleX(-1)" : undefined,
      background: "#000",
      ...style,
    },
  });
};
