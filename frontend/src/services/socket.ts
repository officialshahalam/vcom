import { WS_URL } from "@/constants/api";

type MessageHandler = (data: Record<string, unknown>) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, MessageHandler[]>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    this._open();
  }

  private _open() {
    if (this.ws) {
      this.ws.close();
    }

    const url = `${WS_URL}?token=${this.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] Connected");
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>;
        const type = data.type as string;
        const handlerList = this.handlers.get(type) ?? [];
        handlerList.forEach((h) => h(data));
      } catch (_) {
        console.warn("[WS] Failed to parse message");
      }
    };

    this.ws.onclose = () => {
      console.log("[WS] Disconnected, reconnecting in 3s…");
      this.reconnectTimer = setTimeout(() => this._open(), 3000);
    };

    this.ws.onerror = (err) => {
      console.error("[WS] Error", err);
    };
  }

  on(type: string, handler: MessageHandler) {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...existing, handler]);
  }

  off(type: string, handler: MessageHandler) {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(
      type,
      existing.filter((h) => h !== handler)
    );
  }

  send(payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn("[WS] Not connected, message dropped");
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

export const socketService = new SocketService();
