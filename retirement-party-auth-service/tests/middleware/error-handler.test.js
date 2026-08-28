import { jest } from "@jest/globals";
import { ZodError } from "zod";
import { errorHandler } from "../../src/middleware/error-handler.js";

describe("Error Handler Middleware Unit Tests", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: "POST",
      originalUrl: "/api/auth/staff",
    };
    res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should pass error to next if headers are already sent", () => {
    res.headersSent = true;
    const err = new Error("Headers sent error");

    errorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should format ZodError into 400 response", () => {
    const zodError = new ZodError([
      { path: ["email"], message: "Invalid email address format", code: "custom" },
      { path: ["password"], message: "Password must be at least 8 characters long", code: "custom" },
    ]);

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation Error: Invalid email address format; Password must be at least 8 characters long",
    });
  });

  it("should handle MongoDB duplicate key error 11000 for email", () => {
    const mongoError = new Error("E11000 duplicate key error collection: users index: idx_users_email_unique");
    mongoError.code = 11000;
    mongoError.keyPattern = { email: 1 };

    errorHandler(mongoError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "A record with this email already exists.",
    });
  });

  it("should handle MongoDB duplicate key error 11000 for generic unique index", () => {
    const mongoError = new Error("E11000 duplicate key error");
    mongoError.code = 11000;

    errorHandler(mongoError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "A record with this field already exists.",
    });
  });

  it("should handle Firebase auth/email-already-exists with 409", () => {
    const firebaseError = new Error("The email already exists.");
    firebaseError.code = "auth/email-already-exists";

    errorHandler(firebaseError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An account with this email address already exists.",
    });
  });

  it("should handle Firebase auth/invalid-password with 400", () => {
    const firebaseError = new Error("Password does not meet requirements.");
    firebaseError.code = "auth/invalid-password";

    errorHandler(firebaseError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "The provided password does not meet security requirements.",
    });
  });

  it.each([
    [401, "Authentication required"],
    [403, "Forbidden resource"],
    [404, "User profile not found"],
    [409, "Profile already registered"],
  ])("should format custom status code error %i", (statusCode, message) => {
    const customError = new Error(message);
    customError.statusCode = statusCode;

    errorHandler(customError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message,
    });
  });

  it("should handle unexpected 500 error in development", () => {
    const internalError = new Error("Unexpected database timeout");

    errorHandler(internalError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unexpected database timeout",
    });
  });

  it("should mask 500 internal errors in production environment", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const internalError = new Error("Sensitive connection string leaked");

      errorHandler(internalError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "An internal server error occurred.",
      });
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

