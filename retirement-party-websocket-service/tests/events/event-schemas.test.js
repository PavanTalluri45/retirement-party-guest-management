import { validateEventPayload } from "../../src/events/event-schemas.js";
import { EVENT_TYPES } from "../../src/events/event-types.js";

describe("Event Schemas Validation", () => {
  describe("CHECKIN_COMPLETED schema", () => {
    it("validates a valid CHECKIN_COMPLETED event payload", () => {
      const payload = {
        eventId: "test-event-uuid-1",
        event: EVENT_TYPES.CHECKIN_COMPLETED,
        timestamp: "2026-08-31T10:00:00.000Z",
        requestId: "req-123",
        data: {
          guestId: "6a91451274ee013aaa69d9e2",
          confirmationNumber: "4429",
          checkedInAt: "2026-08-29T06:58:27.014Z",
          checkedInBy: "H6kMmBnXcMfDdnuhxp5xs5J8Ms32",
          verificationMethod: "CONFIRMATION",
        },
      };

      const result = validateEventPayload(payload);
      expect(result.success).toBe(true);
      expect(result.data.event).toBe(EVENT_TYPES.CHECKIN_COMPLETED);
      expect(result.data.data.guestId).toBe("6a91451274ee013aaa69d9e2");
      expect(result.data.data.verificationMethod).toBe("CONFIRMATION");
    });

    it("validates CHECKIN_COMPLETED with PHONE verification method", () => {
      const payload = {
        event: EVENT_TYPES.CHECKIN_COMPLETED,
        data: {
          guestId: "6a91451274ee013aaa69d9e2",
          checkedInAt: "2026-08-29T06:58:27.014Z",
          checkedInBy: "H6kMmBnXcMfDdnuhxp5xs5J8Ms32",
          verificationMethod: "PHONE",
        },
      };

      const result = validateEventPayload(payload);
      expect(result.success).toBe(true);
    });

    it("rejects CHECKIN_COMPLETED when guestId is missing", () => {
      const payload = {
        event: EVENT_TYPES.CHECKIN_COMPLETED,
        data: {
          checkedInAt: "2026-08-29T06:58:27.014Z",
          checkedInBy: "H6kMmBnXcMfDdnuhxp5xs5J8Ms32",
          verificationMethod: "CONFIRMATION",
        },
      };

      const result = validateEventPayload(payload);
      expect(result.success).toBe(false);
    });

    it("rejects CHECKIN_COMPLETED with invalid verificationMethod", () => {
      const payload = {
        event: EVENT_TYPES.CHECKIN_COMPLETED,
        data: {
          guestId: "6a91451274ee013aaa69d9e2",
          checkedInAt: "2026-08-29T06:58:27.014Z",
          checkedInBy: "H6kMmBnXcMfDdnuhxp5xs5J8Ms32",
          verificationMethod: "INVALID_METHOD",
        },
      };

      const result = validateEventPayload(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Deprecated GUEST_REGISTERED payloads", () => {
    it("rejects GUEST_REGISTERED payloads because the event is unsupported", () => {
      const payload = {
        eventId: "test-event-uuid-2",
        event: "GUEST_REGISTERED",
        timestamp: "2026-08-31T10:00:00.000Z",
        requestId: "req-456",
        data: {
          guestId: "6a91451274ee013aaa69d9e3",
          confirmationNumber: "3524",
          registeredAt: "2026-08-28T08:20:33.121Z",
        },
      };

      const result = validateEventPayload(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("General validation rules", () => {
    it("rejects null or non-object payloads", () => {
      expect(validateEventPayload(null).success).toBe(false);
      expect(validateEventPayload(undefined).success).toBe(false);
      expect(validateEventPayload("string-payload").success).toBe(false);
    });

    it("rejects unknown event types", () => {
      const payload = {
        event: "UNKNOWN_EVENT_TYPE",
        data: {},
      };

      const result = validateEventPayload(payload);
      expect(result.success).toBe(false);
    });
  });
});

