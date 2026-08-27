import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createStaffSchema } from "../src/validators/auth.validator.js";
import { errorHandler } from "../src/middleware/error-handler.js";

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe("Error Handler Middleware", () => {
  it("should format ZodError into 400 response with message", () => {
    let zodError;
    try {
      createStaffSchema.parse({ name: "", email: "invalid", password: "123" });
    } catch (err) {
      zodError = err;
    }

    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(zodError, req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Validation Error:.*Invalid email address format/);
  });

  it("should handle MongoDB duplicate key error 11000", () => {
    const mongoError = new Error("E11000 duplicate key error");
    mongoError.code = 11000;
    mongoError.keyPattern = { email: 1 };

    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(mongoError, req, res, next);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "A record with this email already exists.");
  });

  it("should format Firebase auth/email-already-exists into 409", () => {
    const firebaseError = new Error("The email already exists.");
    firebaseError.code = "auth/email-already-exists";

    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(firebaseError, req, res, next);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "An account with this email address already exists.");
  });

  it("should format custom status code errors", () => {
    const customError = new Error("Custom not found error");
    customError.statusCode = 404;

    const req = {};
    const res = createMockRes();
    const next = () => {};

    errorHandler(customError, req, res, next);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Custom not found error");
  });
});
