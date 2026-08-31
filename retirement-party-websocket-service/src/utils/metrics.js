/**
 * In-memory runtime metrics for the WebSocket Service.
 *
 * Tracks safe, non-sensitive operational counters.
 * No unlimited growth: counters are integers only.
 * No personal data, no token data, no event payloads stored here.
 *
 * For a multi-instance deployment, these metrics would need to be
 * aggregated via a shared store (e.g. Redis). For the current
 * single-instance deployment they are sufficient.
 */

const metrics = {
  /** Total unique socket connections ever established */
  totalConnections: 0,

  /** Currently active socket connections (all roles) */
  activeConnections: 0,

  /** Currently active sockets that are in the admin-dashboard room */
  adminConnections: 0,

  /** Total sockets that have disconnected */
  disconnects: 0,

  /** Total internal events received via POST /internal/events */
  eventsReceived: 0,

  /** Total events successfully broadcast to admin-dashboard room */
  eventsBroadcast: 0,

  /** Total events that failed validation or broadcasting */
  eventErrors: 0,
};

export function increment(key) {
  if (key in metrics) {
    metrics[key]++;
  }
}

export function decrement(key) {
  if (key in metrics && metrics[key] > 0) {
    metrics[key]--;
  }
}

export function getMetrics() {
  return { ...metrics };
}

export function resetMetrics() {
  for (const key of Object.keys(metrics)) {
    metrics[key] = 0;
  }
}

export default { increment, decrement, getMetrics, resetMetrics };
