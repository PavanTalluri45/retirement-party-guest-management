import { Server } from "socket.io";
import { config } from "../config/env.js";
import { socketAuthMiddleware } from "./socket-auth.js";
import { handleAdminConnection } from "./admin-room.js";

/**
 * Creates and configures the Socket.IO server instance.
 *
 * CORS is restricted to the Admin Frontend only (NEXT_PUBLIC_WEBSOCKET_URL consumers).
 * The socket lifecycle is:
 *   1. Client connects with auth.token (Firebase ID Token)
 *   2. socketAuthMiddleware verifies the token and checks ADMIN role via Auth Service
 *   3. handleAdminConnection joins the socket to admin-dashboard room
 *   4. Events are broadcast to that room via POST /internal/events
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Use WebSocket transport first, fall back to polling only if needed
    transports: ["websocket", "polling"],
    // Connection timeout
    connectTimeout: 10000,
  });

  // Apply authentication middleware to every incoming socket connection
  io.use(socketAuthMiddleware);

  // Handle authenticated connections
  io.on("connection", (socket) => {
    handleAdminConnection(io, socket);
  });

  console.log("[WebSocket Service] Socket.IO server configured.");

  return io;
}

export default { createSocketServer };
