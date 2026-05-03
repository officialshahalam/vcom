import { Platform, Alert, Linking } from "react-native";

export type PermissionStatus = "granted" | "denied" | "undetermined";

/**
 * Check if an error is a permission denial error
 */
export const isPermissionDeniedError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "NotAllowedError";
  }
  const err = error as any;
  return err?.name === "NotAllowedError" || err?.message?.includes("Permission denied");
};

/**
 * Request camera and microphone permissions
 * Returns true if permissions granted, false if denied
 */
export const requestMediaPermissions = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Stop the stream as we only needed to check permissions
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.warn("[permissions] getUserMedia error:", error);
    return false;
  }
};

/**
 * Open app settings to allow user to grant permissions
 */
export const openAppSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === "ios") {
      // iOS: Open Settings app at app permissions
      await Linking.openURL("app-settings:");
    } else if (Platform.OS === "android") {
      // Android: Open app settings
      await Linking.openSettings();
    }
  } catch (error) {
    console.warn("[permissions] Failed to open settings:", error);
  }
};

/**
 * Show permission denied alert with option to open settings
 */
export const showPermissionDeniedAlert = async (): Promise<void> => {
  return new Promise((resolve) => {
    Alert.alert(
      "Camera & Microphone Access",
      "This app needs access to your camera and microphone to make video calls. Please allow permissions in Settings.",
      [
        {
          text: "Cancel",
          onPress: () => resolve(),
          style: "cancel",
        },
        {
          text: "Open Settings",
          onPress: async () => {
            await openAppSettings();
            resolve();
          },
        },
      ],
    );
  });
};

/**
 * Show audio-only fallback confirmation
 */
export const showAudioOnlyFallbackAlert = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      "Camera Access Denied",
      "Camera access was denied. Would you like to make an audio-only call instead?",
      [
        {
          text: "Cancel",
          onPress: () => resolve(false),
          style: "cancel",
        },
        {
          text: "Audio Call",
          onPress: () => resolve(true),
          style: "default",
        },
      ],
    );
  });
};
