import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";

type Props = {
  stream: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  style?: React.CSSProperties;
};

/**
 * Cross-platform video renderer:
 * - Web: Uses HTML5 <video> element
 * - Native (iOS/Android): Uses RTCView from react-native-webrtc
 */
export const VideoView: React.FC<Props> = ({ stream, muted = false, mirror = false, style }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (Platform.OS === "web" && node.srcObject !== stream) {
      node.srcObject = stream;
    }
  }, [stream]);

  // Web build: Use HTML5 video element
  if (Platform.OS === "web") {
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
  }

  // Native builds: Use RTCView from react-native-webrtc
  // RTCView expects a WebRTC MediaStream directly
  try {
    // Dynamically import RTCView for native builds
    const RTCView = require("react-native-webrtc").RTCView;
    return (
      <RTCView
        streamURL={stream?.toURL?.()}
        objectFit="cover"
        style={{
          flex: 1,
          backgroundColor: "#000",
          transform: mirror ? [{ scaleX: -1 }] : undefined,
          ...style,
        }}
      />
    );
  } catch {
    // Fallback if react-native-webrtc is not available
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }
};
