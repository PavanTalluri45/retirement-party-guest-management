import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import { config } from "../../src/config/env.js";
import { initWebsocketService } from "../../src/services/websocket.service.js";
import { EVENT_TYPES } from "../../src/events/event-types.js";

describe("Event Routes (POST /internal/events)", () => {
  let mockIo;

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    initWebsocketService(mockIo);
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app)
      .post("/internal/events")
      .send({
        event: EVENT_TYPES.CHECKIN_COMPLETED,
        data: {
          guestId: "6a91451274ee013aaa69d9e2",
          checkedInAt: "2026-08-29T06:58:27.014Z",
          checkedInBy: "H6kMmBnXcMfDdnuhxp5xs5J8Ms32",
          verificationMethod: "CONFIRMATION",
        },
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when event type is invalid", async () => {
    const res = await request(app)
      .post("/internal/events")
      .set("Authorization", `Bearer ${config.internalServiceToken}`)
      .send({
        event: "INVALID_EVENT",
        data: {},
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 202 and broadcasts CHECKIN_COMPLETED event", async () => {
    const payload = {
      event: EVENT_TYPES.CHECKIN_COMPLETED,
      data: {
        guestId: "6a91451274ee013aaa69d9e2",
        confirmationNumber: "4429",
        checkedInAt: "2026-08-29T06:58:27.014Z",
        checkedInBy: "H6kMmBnXcMfDdnuhxp5xs5J8Ms32",
        verificationMethod: "CONFIRMATION",
      },
    };

    const res = await request(app)
      .post("/internal/events")
      .set("Authorization", `Bearer ${config.internalServiceToken}`)
      .set("X-Request-ID", "gateway-req-999")
      .send(payload);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.eventId).toBeDefined();

    expect(mockIo.to).toHaveBeenCalledWith("admin-dashboard");
    expect(mockIo.emit).toHaveBeenCalledWith(
      EVENT_TYPES.CHECKIN_COMPLETED,
      expect.objectContaining({
        event: EVENT_TYPES.CHECKIN_COMPLETED,
        requestId: "gateway-req-999",
        data: expect.objectContaining({
          guestId: "6a91451274ee013aaa69d9e2",
          confirmationNumber: "4429",
        }),
      })
    );
  });

  it("rejects GUEST_REGISTERED payloads because the event is no longer supported", async () => {
    const payload = {
      event: "GUEST_REGISTERED",
      data: {
        guestId: "6a91451274ee013aaa69d9e3",
        confirmationNumber: "3524",
        registeredAt: "2026-08-28T08:20:33.121Z",
      },
    };

    const res = await request(app)
      .post("/internal/events")
      .set("Authorization", `Bearer ${config.internalServiceToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

