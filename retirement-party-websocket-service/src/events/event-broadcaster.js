import { increment } from "../utils/metrics.js";

/**
 * Broadcasts a validated event envelope to the "admin-dashboard" Socket.IO room.
 *
 * ARCHITECTURE NOTE:
 * - WebSocket Service is NOT the source of truth.
 * - The event is a notification: "something changed."
 * - Admin Frontend must re-fetch authoritative data from REST APIs after receiving it.
 * - Do NOT send the full guest table or computed analytics through WebSocket.
 *
 * COMPLEXITY:
 * - io.to("admin-dashboard").emit() is O(N) where N = number of admin sockets.
 * - Internal connection tracking uses Socket.IO's built-in room Map (O(1) lookup).
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 * @param {object} event - The validated, enriched event envelope
 */
export function broadcastToAdminDashboard(io, event) {
  io.to("admin-dashboard").emit(event.event, event);
  increment("eventsBroadcast");

  if (process.env.NODE_ENV !== "test") {
    console.log(
      JSON.stringify({
        level: "info",
        operation: "BROADCAST",
        eventType: event.event,
        eventId: event.eventId,
        requestId: event.requestId,
        room: "admin-dashboard",
      })
    );
  }
}

export default { broadcastToAdminDashboard };
