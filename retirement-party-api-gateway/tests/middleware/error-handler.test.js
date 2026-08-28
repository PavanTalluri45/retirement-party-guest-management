import { jest } from "@jest/globals";
import { ZodError } from "zod";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { ProxyError } from "../../src/utils/proxy-request.js";

describe("Error Handler Middleware Unit Tests", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: "GET",
      originalUrl: "/test",
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
    const err = new Error("Headers already sent error");

    errorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should handle ZodError with 400 status and formatted issues", () => {
    const zodError = new ZodError([
      {
        path: ["email"],
        message: "Invalid email format",
        code: "custom",
      },
      {
        path: ["password"],
        message: "Password too short",
        code: "custom",
      },
    ]);

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation Error: Invalid email format; Password too short",
    });
  });

  it("should handle ProxyError with 502 status", () => {
    const proxyError = new ProxyError("Downstream network failure", new Error("ECONNREFUSED"));

    errorHandler(proxyError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication service is temporarily unavailable. Please try again shortly.",
    });
  });

  it("should handle ECONNREFUSED network errors with 502 status", () => {
    const connError = new Error("connect ECONNREFUSED 127.0.0.1:5000");
    connError.code = "ECONNREFUSED";

    errorHandler(connError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication service is temporarily unavailable. Please try again shortly.",
    });
  });

  it("should handle ENOTFOUND DNS errors with 502 status", () => {
    const dnsError = new Error("getaddrinfo ENOTFOUND auth-service");
    dnsError.code = "ENOTFOUND";

    errorHandler(dnsError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication service is temporarily unavailable. Please try again shortly.",
    });
  });

  it.each([
    [401, "Unauthorized access"],
    [403, "Forbidden resource"],
    [404, "Route not found"],
    [409, "User already exists"],
    [429, "Too many requests"],
    [503, "Service unavailable"],
  ])("should handle explicit HTTP status error %i", (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message,
    });
  });

  it("should handle generic 500 error safely in development", () => {
    const err = new Error("Something broke internally");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Something broke internally",
    });
  });

  it("should mask 500 internal errors in production environment", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const err = new Error("Database password leaked in error");

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "An internal gateway error occurred.",
      });
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

