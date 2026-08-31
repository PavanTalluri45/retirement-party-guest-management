import { jest } from "@jest/globals";
import http from "node:http";
import { io as Client } from "socket.io-client";
import request from "supertest";
import app from "../../src/app.js";
import { createSocketServer } from "../../src/socket/socket-server.js";
import { initWebsocketService } from "../../src/services/websocket.service.js";
import { setAdminAuth } from "../../src/config/firebase.js";
import { config } from "../../src/config/env.js";
import { EVENT_TYPES } from "../../src/events/event-types.js";

describe("WebSocket Service End-to-End Integration", () => {
  let server, io, serverPort;
  const originalFetch = global.fetch;

  beforeAll((done) => {
    // Mock Firebase Admin Auth
    setAdminAuth({
      verifyIdToken: async (token) => {
        if (token === "valid-admin-token") {
          return {
            uid: "firebase-admin-uid-123",
            email: "talluripavankumar88@gmail.com",
          };
        }
        if (token === "valid-staff-token") {
          return {
            uid: "firebase-staff-uid-456",
            email: "staff@event.com",
          };
        }
        const err = new Error("Invalid token");
        err.code = "auth/argument-error";
        throw err;
      },
    });

    // Mock Auth Service HTTP response
    global.fetch = jest.fn().mockImplementation(async (url, options) => {
      const authHeader = options?.headers?.Authorization || "";
      const token = authHeader.replace("Bearer ", "");

      if (token === "valid-admin-token") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              user: {
                firebaseUid: "firebase-admin-uid-123",
                role: "ADMIN",
                isActive: true,
                name: "Pavan Kumar Talluri",
                email: "talluripavankumar88@gmail.com",
              },
            },
          }),
        };
      }

      if (token === "valid-staff-token") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              user: {
                firebaseUid: "firebase-staff-uid-456",
                role: "STAFF",
                isActive: true,
                name: "Staff User",
                email: "staff@event.com",
              },
            },
          }),
        };
      }

      return {
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: "Unauthorized" }),
      };
    });

    server = http.createServer(app);
    io = createSocketServer(server);
    initWebsocketService(io);

    server.listen(0, () => {
      serverPort = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    global.fetch = originalFetch;
    if (io) {
      io.close(() => {
        if (server && server.listening) {
          server.close(done);
        } else {
          done();
        }
      });
    } else if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  it("successfully connects authenticated Admin client and broadcasts CHECKIN_COMPLETED", (done) => {
    const clientSocket = Client(`http://localhost:${serverPort}`, {
      auth: {
        token: "valid-admin-token",
      },
      transports: ["websocket"],
      forceNew: true,
    });

    clientSocket.once("connect", async () => {
      expect(clientSocket.connected).toBe(true);

      // Listen for CHECKIN_COMPLETED event on client
      clientSocket.once(EVENT_TYPES.CHECKIN_COMPLETED, (event) => {
        try {
          expect(event.event).toBe(EVENT_TYPES.CHECKIN_COMPLETED);
          expect(event.eventId).toBeDefined();
          expect(event.timestamp).toBeDefined();
          expect(event.requestId).toBe("req-e2e-123");
          expect(event.data.guestId).toBe("6a91451274ee013aaa69d9e2");
          expect(event.data.confirmationNumber).toBe("4429");
          expect(event.data.checkedInBy).toBe("H6kMmBnXcMfDdnuhxp5xs5J8Ms32");
          expect(event.data.verificationMethod).toBe("CONFIRMATION");

          clientSocket.disconnect();
          done();
        } catch (err) {
          clientSocket.disconnect();
          done(err);
        }
      });

      // Verification Service posts CHECKIN_COMPLETED event to /internal/events
      const res = await request(app)
        .post("/internal/events")
        .set("Authorization", `Bearer ${config.internalServiceToken}`)
        .send({
          event: EVENT_TYPES.CHECKIN_COMPLETED,
          requestId: "req-e2e-123",
          data: {
            guestId: "6a91451274ee013aaa69d9e2",
            confirmationNumber: "4429",
            checkedInAt: "2026-08-29T06:58:27.014Z",
            checkedInBy: "H6kMmBnXcMfDdnuhxp5xs5J8Ms32",
            verificationMethod: "CONFIRMATION",
          },
        });

      expect(res.status).toBe(202);
    });
  });

  it("rejects connection when Staff credentials are used", (done) => {
    const staffSocket = Client(`http://localhost:${serverPort}`, {
      auth: {
        token: "valid-staff-token",
      },
      transports: ["websocket"],
      forceNew: true,
    });

    staffSocket.once("connect_error", (err) => {
      expect(err.message).toBe("Access denied: Admin role required for this connection.");
      staffSocket.disconnect();
      done();
    });

    staffSocket.once("connect", () => {
      staffSocket.disconnect();
      done(new Error("Staff socket should not have connected!"));
    });
  });

  it("rejects unauthenticated connection", (done) => {
    const unauthSocket = Client(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      forceNew: true,
    });

    unauthSocket.once("connect_error", (err) => {
      expect(err.message).toBe("Authentication token required.");
      unauthSocket.disconnect();
      done();
    });

    unauthSocket.once("connect", () => {
      unauthSocket.disconnect();
      done(new Error("Unauthenticated socket should not have connected!"));
    });
  });

  it("allows Admin to disconnect and reconnect successfully", (done) => {
    const adminSocket = Client(`http://localhost:${serverPort}`, {
      auth: {
        token: "valid-admin-token",
      },
      transports: ["websocket"],
      forceNew: true,
    });

    adminSocket.once("connect", () => {
      expect(adminSocket.connected).toBe(true);

      adminSocket.once("disconnect", () => {
        // Now connect again
        adminSocket.once("connect", () => {
          expect(adminSocket.connected).toBe(true);
          adminSocket.disconnect();
          done();
        });
        adminSocket.connect();
      });

      adminSocket.disconnect();
    });
  });
});

