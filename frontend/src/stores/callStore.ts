import { create } from "zustand";

export type CallStatus = "idle" | "calling" | "ringing" | "active";

export type CallPeer = {
  userId: number;
  fullName?: string;
  profilePicture?: string | null;
};

type CallStore = {
  status: CallStatus;
  callId: string | null;
  peer: CallPeer | null;
  isCaller: boolean;
  // SDPs that the useWebRTC hook needs to consume once it mounts/advances.
  pendingRemoteOffer: RTCSessionDescriptionInit | null;
  pendingRemoteAnswer: RTCSessionDescriptionInit | null;
  // ICE candidates that arrived before the peer connection was ready.
  pendingIce: RTCIceCandidateInit[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  showPermissionModal: boolean;

  startCall: (peer: CallPeer) => void;
  onIncomingCall: (params: { callId: string; from: number; sdp: RTCSessionDescriptionInit }) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  onCallAnswered: (params: { callId: string; sdp: RTCSessionDescriptionInit }) => void;
  onRemoteCallEnd: () => void;
  endCall: () => void;
  setShowPermissionModal: (show: boolean) => void;

  setCallId: (callId: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  clearPendingOffer: () => void;
  clearPendingAnswer: () => void;
  enqueueIce: (candidate: RTCIceCandidateInit) => void;
  drainIce: () => RTCIceCandidateInit[];
  reset: () => void;
};

const initialState = {
  status: "idle" as CallStatus,
  callId: null,
  peer: null,
  isCaller: false,
  pendingRemoteOffer: null,
  pendingRemoteAnswer: null,
  pendingIce: [] as RTCIceCandidateInit[],
  localStream: null,
  remoteStream: null,
  showPermissionModal: false,
};

export const useCallStore = create<CallStore>((set, get) => ({
  ...initialState,

  startCall: (peer) => {
    set({ ...initialState, status: "calling", peer, isCaller: true, showPermissionModal: true });
  },

  onIncomingCall: ({ callId, from, sdp }) => {
    // If we're already busy, auto-reject would be ideal; for now just ignore the second call.
    if (get().status !== "idle") return;
    set({
      ...initialState,
      status: "ringing",
      callId,
      peer: { userId: from },
      isCaller: false,
      pendingRemoteOffer: sdp,
      showPermissionModal: true,
    });
  },

  acceptCall: () => {
    if (get().status !== "ringing") return;
    set({ status: "active", showPermissionModal: false });
  },

  rejectCall: () => {
    get().localStream?.getTracks().forEach((t) => t.stop());
    set({ ...initialState });
  },

  onCallAnswered: ({ callId, sdp }) => {
    set({ callId, pendingRemoteAnswer: sdp, status: "active", showPermissionModal: false });
  },

  onRemoteCallEnd: () => {
    get().localStream?.getTracks().forEach((t) => t.stop());
    set({ ...initialState });
  },

  endCall: () => {
    get().localStream?.getTracks().forEach((t) => t.stop());
    set({ ...initialState });
  },

  setShowPermissionModal: (show) => set({ showPermissionModal: show }),

  setCallId: (callId) => set({ callId }),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  clearPendingOffer: () => set({ pendingRemoteOffer: null }),
  clearPendingAnswer: () => set({ pendingRemoteAnswer: null }),
  enqueueIce: (candidate) => set((state) => ({ pendingIce: [...state.pendingIce, candidate] })),
  drainIce: () => {
    const list = get().pendingIce;
    set({ pendingIce: [] });
    return list;
  },
  reset: () => set({ ...initialState }),
}));
