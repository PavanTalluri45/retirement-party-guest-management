import { randomUUID } from "node:crypto";

/**
 * Generates a unique event ID for every event envelope.
 * Used for debugging and future deduplication support.
 * Format: standard UUID v4 (crypto.randomUUID).
 */
export function generateEventId() {
  return randomUUID();
}

export default generateEventId;
