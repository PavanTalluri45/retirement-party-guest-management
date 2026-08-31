import { jest } from "@jest/globals";
import { internalAuth } from "../../src/middleware/internal-auth.js";
import { config } from "../../src/config/env.js";

describe("Internal Service Authentication Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("returns 401 if Authorization header is missing", () => {
    internalAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Internal service authentication required.",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if Authorization header does not start with Bearer", () => {
    req.headers["authorization"] = "Basic some_credentials";

    internalAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if Bearer token is invalid", () => {
    req.headers["authorization"] = "Bearer wrong-token-value";

    internalAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Invalid internal service token.",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() if valid internal token is provided", () => {
    req.headers["authorization"] = `Bearer ${config.internalServiceToken}`;

    internalAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

