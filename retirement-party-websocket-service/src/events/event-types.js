/**
 * Canonical event type constants for the WebSocket Service.
 *
 * Only these event types are accepted by POST /internal/events.
 * Any other type is rejected with a 400 validation error.
 */
export const EVENT_TYPES = Object.freeze({
  CHECKIN_COMPLETED: "CHECKIN_COMPLETED",
});

export const ALLOWED_EVENT_TYPES = Object.values(EVENT_TYPES);

export default EVENT_TYPES;
