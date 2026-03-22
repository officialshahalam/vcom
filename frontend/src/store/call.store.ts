import { create } from "zustand";
import { socketService } from "@/services/socket";

type CallStatus = "idle" | "calling" | "incoming" | "connected" | "ended";

interface CallState {
  status: CallStatus;
  callType: "audio" | "video";
  remoteUserId: string | null;
  remoteUsername: string | null;
  offer: unknown;
  answer: unknown;
  iceCandidates: unknown[];

  startCall: (userId: string, username: string, callType?: "audio" | "video") => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  setIncoming: (callerId: string, callerName: string, offer: unknown, callType: "audio" | "video") => void;
  setAnswer: (answer: unknown) => void;
  addIceCandidate: (candidate: unknown) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  status: "idle",
  callType: "video",
  remoteUserId: null,
  remoteUsername: null,
  offer: null,
  answer: null,
  iceCandidates: [],

  startCall: (userId, username, callType = "video") => {
    set({ status: "calling", remoteUserId: userId, remoteUsername: username, callType });
    // TODO: Create RTCPeerConnection, generate offer, then send:
    // socketService.send({ type: "call:offer", receiverId: userId, offer, callType });
    // Remember to dispose the RTCPeerConnection in endCall/rejectCall/reset.
  },

  acceptCall: () => {
    const { remoteUserId, offer } = get();
    if (!remoteUserId || !offer) return;
    set({ status: "connected" });
    // TODO: Set remote description from offer, generate answer, then send:
    // socketService.send({ type: "call:answer", callerId: remoteUserId, answer });
    // Handle ICE candidates gathered during negotiation.
  },

  rejectCall: () => {
    const { remoteUserId } = get();
    if (remoteUserId) {
      socketService.send({ type: "call:reject", callerId: remoteUserId });
    }
    set({ status: "idle", remoteUserId: null, remoteUsername: null, offer: null });
  },

  endCall: () => {
    const { remoteUserId } = get();
    if (remoteUserId) {
      socketService.send({ type: "call:end", targetId: remoteUserId });
    }
    set({ status: "ended" });
    setTimeout(() => set({ status: "idle", remoteUserId: null, remoteUsername: null }), 1500);
  },

  setIncoming: (callerId, callerName, offer, callType) => {
    set({
      status: "incoming",
      remoteUserId: callerId,
      remoteUsername: callerName,
      offer,
      callType,
    });
  },

  setAnswer: (answer) => set({ answer, status: "connected" }),

  addIceCandidate: (candidate) =>
    set((state) => ({ iceCandidates: [...state.iceCandidates, candidate] })),

  reset: () =>
    set({
      status: "idle",
      remoteUserId: null,
      remoteUsername: null,
      offer: null,
      answer: null,
      iceCandidates: [],
    }),
}));
