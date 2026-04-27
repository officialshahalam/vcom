import { useEffect } from "react";
import { WS_EVENTS } from "../constants";
import { useCallStore } from "../stores/callStore";
import { useWebSocketStore } from "../stores/webSocketStore";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Module-level peer connection so the websocket dispatcher can apply ICE
// candidates directly to the active call, even from outside the hook.
let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;

const cleanupPeer = (): void => {
  if (pc) {
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.onconnectionstatechange = null;
    try {
      pc.close();
    } catch {
      /* no-op */
    }
  }
  pc = null;

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        /* no-op */
      }
    });
  }
  localStream = null;

  useCallStore.getState().setLocalStream(null);
  useCallStore.getState().setRemoteStream(null);
};

const createPeerConnection = (): RTCPeerConnection => {
  const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  connection.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) {
      useCallStore.getState().setRemoteStream(stream);
    }
  };

  connection.onicecandidate = (event) => {
    if (!event.candidate) return;
    const activeCallId = useCallStore.getState().callId;
    if (!activeCallId) {
      // Caller hasn't received server-assigned callId yet — buffer locally.
      useCallStore.getState().enqueueIce(event.candidate.toJSON());
      return;
    }
    useWebSocketStore.getState().send(WS_EVENTS.CALL_ICE_CANDIDATE, {
      callId: activeCallId,
      candidate: event.candidate.toJSON(),
    });
  };

  return connection;
};

const acquireLocalMedia = async (connection: RTCPeerConnection): Promise<void> => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream = stream;
  useCallStore.getState().setLocalStream(stream);
  stream.getTracks().forEach((track) => connection.addTrack(track, stream));
};

/**
 * Called by the websocket dispatcher when a remote ICE candidate arrives.
 * If the peer connection is ready, applies it directly; otherwise buffers
 * it in the store so the hook can drain it once the connection is set up.
 */
export const applyRemoteIceCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
  if (pc && pc.remoteDescription) {
    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      console.warn("[call] failed to apply remote ICE candidate", error);
    }
    return;
  }
  useCallStore.getState().enqueueIce(candidate);
};

/**
 * Drives the RTCPeerConnection lifecycle based on callStore transitions.
 * Mount once inside <CallOverlay /> — handles both caller and callee sides.
 * Web-first implementation using the browser's native WebRTC API.
 */
export const useWebRTC = (): void => {
  const status = useCallStore((s) => s.status);
  const isCaller = useCallStore((s) => s.isCaller);
  const callId = useCallStore((s) => s.callId);
  const peer = useCallStore((s) => s.peer);
  const pendingRemoteOffer = useCallStore((s) => s.pendingRemoteOffer);
  const pendingRemoteAnswer = useCallStore((s) => s.pendingRemoteAnswer);

  // --- caller path: create offer ---------------------------------------
  useEffect(() => {
    if (status !== "calling" || !isCaller || pc || !peer) return;

    let cancelled = false;
    (async () => {
      try {
        pc = createPeerConnection();
        await acquireLocalMedia(pc);
        if (cancelled || !pc) return;

        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);

        useWebSocketStore.getState().send(WS_EVENTS.CALL_OFFER, {
          toUserId: peer.userId,
          sdp: offer,
        });
      } catch (error) {
        console.error("[call] failed to start outgoing call", error);
        useCallStore.getState().endCall();
        cleanupPeer();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, isCaller, peer]);

  // --- callee path: apply offer + create answer -------------------------
  useEffect(() => {
    if (status !== "active" || isCaller || pc || !pendingRemoteOffer || !callId) return;

    let cancelled = false;
    (async () => {
      try {
        pc = createPeerConnection();
        await acquireLocalMedia(pc);
        if (cancelled || !pc) return;

        await pc.setRemoteDescription(pendingRemoteOffer);

        // Flush any ICE candidates that arrived before we were ready.
        const pending = useCallStore.getState().drainIce();
        for (const candidate of pending) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (error) {
            console.warn("[call] failed to apply buffered ICE candidate", error);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        useWebSocketStore.getState().send(WS_EVENTS.CALL_ANSWER, { callId, sdp: answer });
        useCallStore.getState().clearPendingOffer();
      } catch (error) {
        console.error("[call] failed to accept incoming call", error);
        useCallStore.getState().endCall();
        cleanupPeer();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, isCaller, pendingRemoteOffer, callId]);

  // --- caller: apply remote answer --------------------------------------
  useEffect(() => {
    if (!pendingRemoteAnswer || !pc || !isCaller) return;

    (async () => {
      try {
        await pc?.setRemoteDescription(pendingRemoteAnswer);
        const pending = useCallStore.getState().drainIce();
        for (const candidate of pending) {
          try {
            await pc?.addIceCandidate(candidate);
          } catch {
            /* no-op */
          }
        }
        useCallStore.getState().clearPendingAnswer();
      } catch (error) {
        console.error("[call] failed to apply answer", error);
      }
    })();
  }, [pendingRemoteAnswer, isCaller]);

  // --- teardown when call returns to idle -------------------------------
  useEffect(() => {
    if (status === "idle") {
      cleanupPeer();
    }
  }, [status]);
};
