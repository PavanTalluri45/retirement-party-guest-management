import { increment, decrement } from "../utils/metrics.js";

/**
 * Handles a successfully authenticated admin socket connection.
 *
 * Responsibilities:
 *   - Join the "admin-dashboard" Socket.IO room
 *   - Update metrics (active/admin connection counts)
 *   - Register disconnect handler with cleanup
 *
 * This function is called ONLY after socketAuthMiddleware has confirmed:
 *   - Valid Firebase ID Token
 *   - role === "ADMIN"
 *   - isActive === true
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function handleAdminConnection(io, socket) {
  const { firebaseUid, name } = socket.data.user || {};

  // Join the admin-dashboard room
  socket.join("admin-dashboard");

  // Update metrics
  increment("totalConnections");
  increment("activeConnections");
  increment("adminConnections");

  if (process.env.NODE_ENV !== "test") {
    console.log(
      JSON.stringify({
        level: "info",
        operation: "ADMIN_CONNECTED",
        socketId: socket.id,
        firebaseUid,
        name,
        room: "admin-dashboard",
      })
    );
  }

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    socket.leave("admin-dashboard");
    decrement("activeConnections");
    decrement("adminConnections");
    increment("disconnects");

    if (process.env.NODE_ENV !== "test") {
      console.log(
        JSON.stringify({
          level: "info",
          operation: "ADMIN_DISCONNECTED",
          socketId: socket.id,
          firebaseUid,
          reason,
        })
      );
    }
  });
}

export default { handleAdminConnection };
