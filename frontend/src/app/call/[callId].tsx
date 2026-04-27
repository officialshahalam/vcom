import React from "react";
import { Redirect } from "expo-router";

/**
 * Legacy route. The active call UI is rendered globally by <CallOverlay /> in
 * the root layout, driven by callStore state. Any direct navigation to
 * /call/:id just bounces back to the tabs — the overlay takes over.
 */
export default function LegacyCallScreen() {
  return <Redirect href={"/home" as never} />;
}
