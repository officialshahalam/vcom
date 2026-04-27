import { useEffect, useMemo, useRef } from "react";
import { WS_BASE_URL, WS_EVENTS } from "../constants";
import { applyRemoteIceCandidate } from "./useWebRTC";
import { useAuthStore } from "../stores/authStore";
import { useCallStore } from "../stores/callStore";
import { useChatStore } from "../stores/chatStore";
import { useWebSocketStore } from "../stores/webSocketStore";
import type { DeliveryAck, Message, PresenceUpdate, ReadAck, TypingEvent } from "../types";

export const useWebSocket = (): void => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const connect = useWebSocketStore((state) => state.connect);
  const disconnect = useWebSocketStore((state) => state.disconnect);
  const setMessageHandler = useWebSocketStore((state) => state.setMessageHandler);
  const send = useWebSocketStore((state) => state.send);

  const wsUrl = useMemo(() => {
    if (!accessToken) return null;
    return `${WS_BASE_URL}/?token=${encodeURIComponent(accessToken)}`;
  }, [accessToken]);

  // Keep a stable ref to the incoming-message dispatcher so we don't re-subscribe
  // every render. Stores are accessed via getState() so the handler identity is constant.
  const handlerRef = useRef((event: { data: string }) => {
    try {
      const parsed = JSON.parse(event.data) as { type: string; payload: unknown };
      const chat = useChatStore.getState();

      switch (parsed.type) {
        case WS_EVENTS.NEW_MESSAGE: {
          const { message, clientId } = parsed.payload as { message: Message; clientId?: string };
          chat.onNewMessage(clientId ? { ...message, clientId } : message);
          break;
        }
        case WS_EVENTS.MESSAGE_DELIVERED:
          chat.onMessageDelivered(parsed.payload as DeliveryAck);
          break;
        case WS_EVENTS.MESSAGE_READ:
          chat.onMessageRead(parsed.payload as ReadAck);
          break;
        case WS_EVENTS.TYPING_START:
          chat.onTypingStart(parsed.payload as TypingEvent);
          break;
        case WS_EVENTS.TYPING_STOP:
          chat.onTypingStop(parsed.payload as TypingEvent);
          break;
        case WS_EVENTS.USER_ONLINE:
          chat.onUserPresenceUpdate(parsed.payload as PresenceUpdate);
          break;
        case WS_EVENTS.CALL_OFFER: {
          const { callId, from, sdp } = parsed.payload as {
            callId: string;
            from: number;
            sdp: RTCSessionDescriptionInit;
          };
          useCallStore.getState().onIncomingCall({ callId, from, sdp });
          break;
        }
        case WS_EVENTS.CALL_ANSWER: {
          const { callId, sdp } = parsed.payload as { callId: string; sdp: RTCSessionDescriptionInit };
          useCallStore.getState().onCallAnswered({ callId, sdp });
          break;
        }
        case WS_EVENTS.CALL_ICE_CANDIDATE: {
          const { candidate } = parsed.payload as { candidate: RTCIceCandidateInit };
          if (candidate) void applyRemoteIceCandidate(candidate);
          break;
        }
        case WS_EVENTS.CALL_END:
        case WS_EVENTS.CALL_REJECTED:
          useCallStore.getState().onRemoteCallEnd();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("[WS] dispatch error", error, event.data);
    }
  });

  useEffect(() => {
    setMessageHandler(handlerRef.current);
    return () => setMessageHandler(null);
  }, [setMessageHandler]);

  useEffect(() => {
    if (!isAuthenticated || !wsUrl) {
      disconnect();
      return;
    }

    connect(wsUrl);
  }, [connect, disconnect, isAuthenticated, wsUrl]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => {
      send(WS_EVENTS.HEARTBEAT, {});
    }, 20_000);
    return () => clearInterval(id);
  }, [isAuthenticated, send]);
};
