import { z } from "zod";
import { EVENT_TYPES } from "./event-types.js";

/**
 * Zod schemas for WebSocket event validation.
 *
 * Field names are derived from the actual MongoDB documents:
 *
 * checkins collection:
 *   guestId, confirmationNumber, checkedInAt, checkedInBy, verificationMethod
 *
 * guests collection:
 *   confirmationNumber, registeredAt (via formatGuest in registration service)
 *
 * Do NOT add invented fields (attendanceStatus, staffId, guestStatus, etc.)
 */

// ─── CHECKIN_COMPLETED data payload ──────────────────────────────────────────

const CheckinCompletedDataSchema = z.object({
  /** MongoDB ObjectId as string — from checkins.guestId */
  guestId: z.string().min(1, "guestId is required"),

  /** 4-digit confirmation code — from guests.confirmationNumber */
  confirmationNumber: z.string().optional(),

  /** ISO 8601 timestamp — from checkins.checkedInAt */
  checkedInAt: z.string().min(1, "checkedInAt is required"),

  /** Firebase UID of the staff member — from checkins.checkedInBy */
  checkedInBy: z.string().min(1, "checkedInBy is required"),

  /** 'CONFIRMATION' | 'PHONE' — from checkins.verificationMethod */
  verificationMethod: z.enum(["CONFIRMATION", "PHONE"]),
});

// ─── Common envelope fields ───────────────────────────────────────────────────

const BaseEventSchema = z.object({
  /** Unique identifier per event for debugging and deduplication */
  eventId: z.string().optional(),

  /** ISO 8601 — overwritten server-side before broadcasting */
  timestamp: z.string().optional(),

  /** Correlation ID propagated from API Gateway / service chain */
  requestId: z.string().optional(),
});

// ─── Combined discriminated schemas ──────────────────────────────────────────

export const CheckinCompletedEventSchema = BaseEventSchema.extend({
  event: z.literal(EVENT_TYPES.CHECKIN_COMPLETED),
  data: CheckinCompletedDataSchema,
});

/**
 * Top-level validator: accepts only the active CHECKIN_COMPLETED event.
 * Returns a standardised Zod result object.
 *
 * @param {unknown} payload
 * @returns {{ success: boolean, data?: object, error?: import('zod').ZodError }}
 */
export function validateEventPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      success: false,
      error: { message: "Payload must be a non-null object" },
    };
  }

  const eventType = payload.event;

  if (eventType === EVENT_TYPES.CHECKIN_COMPLETED) {
    return CheckinCompletedEventSchema.safeParse(payload);
  }

  return {
    success: false,
    error: {
      message: `Unknown event type: "${eventType}". Allowed: ${Object.values(EVENT_TYPES).join(", ")}`,
    },
  };
}

export default { validateEventPayload, CheckinCompletedEventSchema };
