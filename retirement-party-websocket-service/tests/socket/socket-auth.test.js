import { jest } from "@jest/globals";
import { socketAuthMiddleware } from "../../src/socket/socket-auth.js";
import { setAdminAuth } from "../../src/config/firebase.js";

describe("Socket Authentication & Authorization Middleware", () => {
  let socket, next;
  const originalFetch = global.fetch;

  beforeEach(() => {
    socket = {
      handshake: {
        auth: {},
      },
      data: {},
    };
    next = jest.fn();

    // Default mock Firebase Admin Auth
    setAdminAuth({
      verifyIdToken: async (token) => {
        if (!token || token === "invalid-token") {
          const err = new Error("Invalid token");
          err.code = "auth/argument-error";
          throw err;
        }
        if (token === "expired-token") {
          const err = new Error("Token expired");
          err.code = "auth/id-token-expired";
          throw err;
        }
        if (token === "revoked-token") {
          const err = new Error("Token revoked");
          err.code = "auth/id-token-revoked";
          throw err;
        }
        return {
          uid: "test-firebase-uid-admin",
          email: "admin@event.com",
        };
      },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("rejects connection when auth token is missing", async () => {
    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Authentication token required.",
      })
    );
  });

  it("rejects connection when token is invalid", async () => {
    socket.handshake.auth.token = "invalid-token";

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Authentication token expired or invalid.",
      })
    );
  });

  it("rejects connection when token has expired", async () => {
    socket.handshake.auth.token = "expired-token";

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Authentication token expired or invalid.",
      })
    );
  });

  it("rejects connection when token has been revoked", async () => {
    socket.handshake.auth.token = "revoked-token";

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Authentication token has been revoked.",
      })
    );
  });

  it("rejects connection when user is STAFF instead of ADMIN", async () => {
    socket.handshake.auth.token = "valid-staff-token";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          user: {
            firebaseUid: "test-firebase-uid-staff",
            role: "STAFF",
            isActive: true,
            name: "Staff Member",
            email: "staff@event.com",
          },
        },
      }),
    });

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied: Admin role required for this connection.",
      })
    );
  });

  it("rejects connection when ADMIN account is inactive", async () => {
    socket.handshake.auth.token = "valid-admin-token";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          user: {
            firebaseUid: "test-firebase-uid-admin",
            role: "ADMIN",
            isActive: false,
            name: "Deactivated Admin",
            email: "admin@event.com",
          },
        },
      }),
    });

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Account is inactive. Please contact an administrator.",
      })
    );
  });

  it("successfully authenticates and admits active ADMIN user", async () => {
    socket.handshake.auth.token = "valid-admin-token";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          user: {
            firebaseUid: "test-firebase-uid-admin",
            role: "ADMIN",
            isActive: true,
            name: "Pavan Kumar Talluri",
            email: "talluripavankumar88@gmail.com",
          },
        },
      }),
    });

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(); // Called with no error
    expect(socket.data.user).toEqual({
      firebaseUid: "test-firebase-uid-admin",
      role: "ADMIN",
      name: "Pavan Kumar Talluri",
      email: "talluripavankumar88@gmail.com",
    });
  });
});

