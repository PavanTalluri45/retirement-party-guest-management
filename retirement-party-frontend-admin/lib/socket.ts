import { io, type Socket } from "socket.io-client";

const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:4001";

let socket: Socket | null = null;

/**
 * Get or create the singleton Socket.IO client connection.
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. Tokens are sent strictly via the `auth` handshake object (never in query params).
 * 2. Socket instance is NEVER stored inside Redux state (avoids non-serializable values).
 * 3. Singleton guarantees only one active connection per Admin browser session.
 *
 * @param token - Fresh Firebase ID Token
 * @returns Socket.IO client instance
 */
export function getSocket(token: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  // If a disconnected instance exists, update auth token and reconnect
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(WEBSOCKET_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  return socket;
}

/**
 * Explicitly disconnects and clears the singleton socket instance.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the currently active socket without creating a new one.
 */
export function getActiveSocket(): Socket | null {
  return socket;
}

const socketService = { getSocket, disconnectSocket, getActiveSocket };
export default socketService;

