import { validateEventPayload } from "../events/event-schemas.js";
import { broadcastEvent } from "../services/websocket.service.js";
import { generateEventId } from "../utils/event-id.js";
import { extractRequestId, generateRequestId } from "../utils/request-id.js";
import { increment } from "../utils/metrics.js";

/**
 * POST /internal/events
 *
 * Internal service-to-service endpoint.
 * Called by Verification Service and Registration Service after successful operations.
 *
 * Processing steps:
 *   1. Validate event type and payload with Zod (rejects unknown types)
 *   2. Generate/preserve eventId  (for debugging and future deduplication)
 *   3. Generate server-side timestamp  (never trust client timestamp)
 *   4. Preserve requestId from calling service or generate one
 *   5. Broadcast enriched event to admin-dashboard room
 *   6. Return 202 Accepted
 *
 * FAILURE HANDLING:
 * - Validation errors → 400 (malformed payload from internal service)
 * - Broadcast errors  → 500 (should be rare; Socket.IO is in-process)
 * - Calling services (Verification, Registration) treat HTTP errors as non-fatal
 *   and do NOT rollback their primary operations.
 */
export async function receiveInternalEvent(req, res, next) {
  try {
    increment("eventsReceived");

    const body = req.body;

    // Step 1: Validate event type + payload
    const parsed = validateEventPayload(body);
    if (!parsed.success) {
      increment("eventErrors");

      const errorMessage =
        parsed.error?.message ||
        (parsed.error?.issues || parsed.error?.errors || [])
          .map((i) => i.message)
          .join("; ") ||
        "Invalid event payload.";

      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // Step 2: Enrich the event envelope server-side
    const enrichedEvent = {
      ...parsed.data,

      // eventId: preserve if supplied, generate if missing
      eventId: parsed.data.eventId || generateEventId(),

      // timestamp: always server-generated (never trust caller's timestamp)
      timestamp: new Date().toISOString(),

      // requestId: preserve from calling service or generate
      requestId:
        parsed.data.requestId ||
        extractRequestId(req) ||
        generateRequestId(),
    };

    // Step 3: Broadcast to admin-dashboard room
    broadcastEvent(enrichedEvent);

    if (process.env.NODE_ENV !== "test") {
      console.log(
        JSON.stringify({
          level: "info",
          operation: "INTERNAL_EVENT_RECEIVED",
          event: enrichedEvent.event,
          eventId: enrichedEvent.eventId,
          requestId: enrichedEvent.requestId,
        })
      );
    }

    return res.status(202).json({
      success: true,
      message: "Event received and broadcast initiated.",
      eventId: enrichedEvent.eventId,
    });
  } catch (err) {
    increment("eventErrors");
    next(err);
  }
}

export default { receiveInternalEvent };
