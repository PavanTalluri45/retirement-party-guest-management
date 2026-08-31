import { broadcastToAdminDashboard } from "../events/event-broadcaster.js";

/**
 * WebSocket Service — thin wrapper around the Socket.IO server instance.
 *
 * Holds the io reference so it is accessible from the event controller
 * without circular imports.
 *
 * NOTE: The socket instance is NEVER stored in Redux or any browser-accessible
 * location. It lives entirely on the server side.
 */

let _io = null;

/**
 * Initializes the websocket service with the Socket.IO server instance.
 * Called once during server startup.
 *
 * @param {import('socket.io').Server} io
 */
export function initWebsocketService(io) {
  _io = io;
}

/**
 * Broadcasts a validated event envelope to the admin-dashboard room.
 *
 * @param {object} eventPayload - Validated and enriched event
 */
export function broadcastEvent(eventPayload) {
  if (!_io) {
    throw new Error("WebSocket service not initialized. Call initWebsocketService() first.");
  }
  broadcastToAdminDashboard(_io, eventPayload);
}

/**
 * Returns the current Socket.IO server instance (for testing or metrics).
 *
 * @returns {import('socket.io').Server|null}
 */
export function getIo() {
  return _io;
}

export default { initWebsocketService, broadcastEvent, getIo };
