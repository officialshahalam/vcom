import React from "react";
import { useWebRTC } from "../../hooks/useWebRTC";
import { IncomingCallModal } from "./IncomingCallModal";
import { ActiveCallView } from "./ActiveCallView";

/**
 * Mount once at the app root. Drives the WebRTC peer connection lifecycle
 * via useWebRTC and renders the appropriate call UI based on callStore status.
 */
export const CallOverlay: React.FC = () => {
  useWebRTC();

  return (
    <>
      <IncomingCallModal />
      <ActiveCallView />
    </>
  );
};
