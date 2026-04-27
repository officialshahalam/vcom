import { create } from "zustand";

type MessageHandler = (event: { data: string }) => void;

type WebSocketStore = {
  socket: WebSocket | null;
  isConnected: boolean;
  connect: (url: string) => void;
  disconnect: () => void;
  send: (type: string, payload: Record<string, unknown>) => void;
  setMessageHandler: (handler: MessageHandler | null) => void;
};

// Module-level state that must not trigger React re-renders.
let currentUrl: string | null = null;
let shouldReconnect = false;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let messageHandler: MessageHandler | null = null;

export const useWebSocketStore = create<WebSocketStore>((set, get) => {
  const openSocket = (url: string): void => {
    const existing = get().socket;
    if (existing && (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN)) {
      return;
    }

    const socket = new WebSocket(url);

    socket.onopen = () => {
      reconnectAttempts = 0;
      set({ isConnected: true });
    };

    socket.onmessage = (event) => {
      messageHandler?.(event as unknown as { data: string });
    };

    socket.onerror = () => {
      set({ isConnected: false });
    };

    socket.onclose = (event) => {
      set({ socket: null, isConnected: false });
      if (!shouldReconnect || !currentUrl) return;

      // Stop reconnecting if the server closed us with an auth failure — looping
      // would just hammer the server with the same bad token.
      if (event.code === 1008) {
        shouldReconnect = false;
        currentUrl = null;
        return;
      }

      const delay = Math.min(1000 * 2 ** reconnectAttempts, 15000);
      reconnectAttempts += 1;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        if (shouldReconnect && currentUrl) openSocket(currentUrl);
      }, delay);
    };

    set({ socket });
  };

  return {
    socket: null,
    isConnected: false,

    connect: (url) => {
      // If already connecting/open to the same url, no-op.
      if (currentUrl === url) {
        const existing = get().socket;
        if (existing && (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN)) {
          return;
        }
      }

      currentUrl = url;
      shouldReconnect = true;
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      openSocket(url);
    },

    disconnect: () => {
      shouldReconnect = false;
      currentUrl = null;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      const socket = get().socket;
      if (socket) {
        // Detach handlers so the scheduled close doesn't try to reconnect.
        socket.onclose = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onopen = null;
        socket.close();
      }
      set({ socket: null, isConnected: false });
    },

    send: (type, payload) => {
      const socket = get().socket;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type, payload }));
    },

    setMessageHandler: (handler) => {
      messageHandler = handler;
    },
  };
});
