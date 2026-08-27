import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { adminAuth } from "../src/config/firebase.js";
import { authClient } from "../src/services/auth-client.js";

describe("Gateway Auth Routes", () => {
  describe("Authentication Gate", () => {
    it("GET /auth/me without token should return 401", async () => {
      const res = await request(app).get("/auth/me");
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it("POST /auth/admin/register without token should return 401", async () => {
      const res = await request(app)
        .post("/auth/admin/register")
        .send({ name: "Admin" });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it("GET /auth/staff without token should return 401", async () => {
      const res = await request(app).get("/auth/staff");
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it("PATCH /auth/staff/123/status without token should return 401", async () => {
      const res = await request(app)
        .patch("/auth/staff/123/status")
        .send({ isActive: false });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });

  describe("Downstream Routing & Error Handling", () => {
    it("GET /auth/me should forward to authClient and return downstream data", async () => {
      const originalVerify = adminAuth.verifyIdToken;
      const originalGetMe = authClient.getMe;

      adminAuth.verifyIdToken = async () => ({
        uid: "mock-admin-uid",
        email: "admin@example.com",
      });

      authClient.getMe = async () => ({
        status: 200,
        data: {
          success: true,
          data: {
            user: {
              firebaseUid: "mock-admin-uid",
              name: "Admin User",
              email: "admin@example.com",
              role: "ADMIN",
              isActive: true,
            },
          },
        },
      });

      try {
        const res = await request(app)
          .get("/auth/me")
          .set("Authorization", "Bearer valid-token");

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.user.role, "ADMIN");
      } finally {
        adminAuth.verifyIdToken = originalVerify;
        authClient.getMe = originalGetMe;
      }
    });

    it("should return 502 if downstream service fails with connection error", async () => {
      const originalVerify = adminAuth.verifyIdToken;
      const originalGetMe = authClient.getMe;

      adminAuth.verifyIdToken = async () => ({
        uid: "mock-uid",
      });

      authClient.getMe = async () => {
        const err = new Error("Connection refused");
        err.name = "ProxyError";
        err.code = "ECONNREFUSED";
        throw err;
      };

      try {
        const res = await request(app)
          .get("/auth/me")
          .set("Authorization", "Bearer valid-token");

        assert.equal(res.status, 502);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /temporarily unavailable/i);
      } finally {
        adminAuth.verifyIdToken = originalVerify;
        authClient.getMe = originalGetMe;
      }
    });
  });
});

