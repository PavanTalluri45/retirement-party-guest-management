import { jest } from "@jest/globals";
import { authenticate } from "../../src/middleware/authenticate.js";
import { adminAuth } from "../../src/config/firebase.js";

describe("Authenticate Middleware Unit Tests", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should return 401 if Authorization header is missing", async () => {
    req.headers = {};

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Authentication required/i),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if Authorization header does not start with Bearer", async () => {
    req.headers = { authorization: "Basic someToken123" };

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Missing or malformed Bearer token/i),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token is empty after Bearer", async () => {
    req.headers = { authorization: "Bearer   " };

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/token missing/i),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if Firebase ID token is invalid", async () => {
    req.headers = { authorization: "Bearer invalid-token" };
    jest.spyOn(adminAuth, "verifyIdToken").mockRejectedValueOnce(new Error("Decoding Firebase ID token failed"));

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired authentication token.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 with specific message if token is expired", async () => {
    req.headers = { authorization: "Bearer expired-token" };
    const expiredError = new Error("Firebase ID token has expired");
    expiredError.code = "auth/id-token-expired";
    jest.spyOn(adminAuth, "verifyIdToken").mockRejectedValueOnce(expiredError);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication token has expired. Please refresh session.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 with specific message if token is revoked", async () => {
    req.headers = { authorization: "Bearer revoked-token" };
    const revokedError = new Error("Firebase ID token has been revoked");
    revokedError.code = "auth/id-token-revoked";
    jest.spyOn(adminAuth, "verifyIdToken").mockRejectedValueOnce(revokedError);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication token has been revoked. Please sign in again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if decoded token has no UID", async () => {
    req.headers = { authorization: "Bearer token-without-uid" };
    jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce({
      email: "test@example.com",
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token payload: missing user identifier.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach req.auth and call next() on valid Firebase ID token", async () => {
    const validToken = "valid-firebase-jwt-token";
    req.headers = { authorization: `Bearer ${validToken}` };

    const mockDecodedToken = {
      uid: "firebase-uid-789",
      email: "admin@example.com",
      auth_time: 1700000000,
      exp: 1700003600,
    };

    jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(mockDecodedToken);

    await authenticate(req, res, next);

    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith(validToken, true);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.auth).toEqual({
      firebaseUid: "firebase-uid-789",
      email: "admin@example.com",
      decodedToken: mockDecodedToken,
    });
    expect(res.status).not.toHaveBeenCalled();
  });
});

