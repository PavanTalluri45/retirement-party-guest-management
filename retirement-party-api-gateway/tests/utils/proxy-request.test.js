import { jest } from "@jest/globals";
import { proxyRequest, ProxyError } from "../../src/utils/proxy-request.js";

describe("Proxy Request Utility Unit Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("should forward GET request with Authorization header from req.headers", async () => {
    const mockReq = {
      method: "GET",
      headers: {
        authorization: "Bearer test-firebase-token",
      },
    };

    const mockResponseData = { success: true, data: { user: { id: "1" } } };
    global.fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockResponseData,
    });

    const result = await proxyRequest("http://localhost:5000/api/auth/me", mockReq);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-firebase-token",
      },
    });
    expect(result).toEqual({
      status: 200,
      data: mockResponseData,
    });
  });

  it("should forward Authorization from req.auth.idToken if not present in headers", async () => {
    const mockReq = {
      method: "GET",
      headers: {},
      auth: {
        idToken: "token-from-auth-context",
      },
    };

    global.fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true }),
    });

    await proxyRequest("http://localhost:5000/api/auth/me", mockReq);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-from-auth-context",
      },
    });
  });

  it("should forward POST request with JSON body", async () => {
    const requestBody = { name: "John Doe", email: "john@example.com" };
    const mockReq = {
      method: "POST",
      headers: {
        authorization: "Bearer auth-token-123",
      },
      body: requestBody,
    };

    global.fetch.mockResolvedValueOnce({
      status: 201,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, message: "Created" }),
    });

    const result = await proxyRequest("http://localhost:5000/api/auth/staff", mockReq);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/auth/staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer auth-token-123",
      },
      body: JSON.stringify(requestBody),
    });
    expect(result.status).toBe(201);
  });

  it("should handle custom options override (method, body, headers)", async () => {
    const mockReq = {
      method: "GET",
      headers: {},
    };

    global.fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ custom: "response" }),
    });

    const customBody = { isActive: false };
    await proxyRequest("http://localhost:5000/api/auth/staff/123/status", mockReq, {
      method: "PATCH",
      body: customBody,
      headers: { "X-Custom-Header": "CustomValue" },
    });

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/auth/staff/123/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Custom-Header": "CustomValue",
      },
      body: JSON.stringify(customBody),
    });
  });

  it("should handle non-JSON text response from downstream service", async () => {
    const mockReq = { method: "GET", headers: {} };

    global.fetch.mockResolvedValueOnce({
      status: 500,
      ok: false,
      headers: new Headers({ "content-type": "text/plain" }),
      text: async () => "Internal Server Error in Service",
    });

    const result = await proxyRequest("http://localhost:5000/api/auth/me", mockReq);

    expect(result).toEqual({
      status: 500,
      data: {
        success: false,
        message: "Internal Server Error in Service",
      },
    });
  });

  it("should throw ProxyError on network connection failure", async () => {
    const mockReq = { method: "GET", headers: {} };
    const networkError = new Error("fetch failed: connect ECONNREFUSED 127.0.0.1:5000");
    global.fetch.mockRejectedValueOnce(networkError);

    await expect(proxyRequest("http://localhost:5000/api/auth/me", mockReq)).rejects.toThrow(ProxyError);
    await expect(proxyRequest("http://localhost:5000/api/auth/me", mockReq)).rejects.toThrow(
      "Failed to reach downstream service at http://localhost:5000/api/auth/me"
    );
  });
});

