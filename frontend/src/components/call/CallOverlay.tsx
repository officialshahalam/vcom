import React from "react";
import { useWebRTC } from "../../hooks/useWebRTC";
import { IncomingCallModal } from "./IncomingCallModal";
import { ActiveCallView } from "./ActiveCallView";
import { PermissionModal } from "./PermissionModal";
import { useCallStore } from "../../stores/callStore";

/**
 * Mount once at the app root. Drives the WebRTC peer connection lifecycle
 * via useWebRTC and renders the appropriate call UI based on callStore status.
 */
export const CallOverlay: React.FC = () => {
  useWebRTC();
  const showPermissionModal = useCallStore((s) => s.showPermissionModal);
  const setShowPermissionModal = useCallStore((s) => s.setShowPermissionModal);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const rejectCall = useCallStore((s) => s.rejectCall);

  return (
    <>
      <PermissionModal
        visible={showPermissionModal}
        onAllow={() => {
          setShowPermissionModal(false);
          // Continue with the call (acceptCall for incoming, continue for outgoing handled by useWebRTC)
          if (!useCallStore.getState().isCaller) {
            acceptCall();
          }
        }}
        onDeny={() => {
          setShowPermissionModal(false);
          // Reject the call
          if (!useCallStore.getState().isCaller) {
            rejectCall();
          } else {
            // For outgoing calls, just end the call
            useCallStore.getState().endCall();
          }
        }}
      />
      <IncomingCallModal />
      <ActiveCallView />
    </>
  );
};
