// ============================================================
// SKILLA — Socket.io Client
// Connessione singleton al backend real-time.
// ============================================================

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Ritorna sempre la stessa istanza (singleton pattern)
export function getSocket(token?: string): Socket {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001", {
      // Autenticazione via JWT token
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
  }
  return socket;
}

// Disconnette e pulisce il socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
