import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { authenticate } from "../src/middleware/authenticate.js";
import { adminAuth } from "../src/config/firebase.js";

describe("Gateway Authenticate Middleware", () => {
  it("should return 401 if Authorization header is missing", async () => {
    const req = { headers: {} };
    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return {
          json(body) {
            responseBody = body;
          },
        };
      },
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await authenticate(req, res, next);

    assert.equal(responseStatus, 401);
    assert.equal(responseBody.success, false);
    assert.match(responseBody.message, /Authentication required/i);
    assert.equal(nextCalled, false);
  });

  it("should return 401 if Authorization header does not start with 'Bearer '", async () => {
    const req = { headers: { authorization: "Basic 12345" } };
    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return {
          json(body) {
            responseBody = body;
          },
        };
      },
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await authenticate(req, res, next);

    assert.equal(responseStatus, 401);
    assert.equal(responseBody.success, false);
    assert.match(responseBody.message, /Authentication required/i);
    assert.equal(nextCalled, false);
  });

  it("should return 401 if token is invalid or expired", async () => {
    const req = { headers: { authorization: "Bearer invalid-token-string" } };
    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return {
          json(body) {
            responseBody = body;
          },
        };
      },
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    // Mock verifyIdToken rejecting
    const originalVerify = adminAuth.verifyIdToken;
    adminAuth.verifyIdToken = async () => {
      const err = new Error("Decoding Firebase ID token failed");
      err.code = "auth/invalid-id-token";
      throw err;
    };

    try {
      await authenticate(req, res, next);
      assert.equal(responseStatus, 401);
      assert.equal(responseBody.success, false);
      assert.match(responseBody.message, /Invalid or expired/i);
      assert.equal(nextCalled, false);
    } finally {
      adminAuth.verifyIdToken = originalVerify;
    }
  });

  it("should attach req.auth and call next() on valid token", async () => {
    const req = { headers: { authorization: "Bearer valid-firebase-token" } };
    let responseStatus = null;
    const res = {
      status(code) {
        responseStatus = code;
        return { json() {} };
      },
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const mockDecoded = {
      uid: "firebase-user-uid-123",
      email: "test@example.com",
    };

    const originalVerify = adminAuth.verifyIdToken;
    adminAuth.verifyIdToken = async (token) => {
      if (token === "valid-firebase-token") {
        return mockDecoded;
      }
      throw new Error("Invalid token");
    };

    try {
      await authenticate(req, res, next);
      assert.equal(nextCalled, true);
      assert.equal(responseStatus, null);
      assert.equal(req.auth.firebaseUid, "firebase-user-uid-123");
      assert.equal(req.auth.email, "test@example.com");
      assert.equal(req.auth.idToken, "valid-firebase-token");
    } finally {
      adminAuth.verifyIdToken = originalVerify;
    }
  });
});

