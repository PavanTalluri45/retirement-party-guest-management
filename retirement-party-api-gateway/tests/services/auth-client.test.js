import { jest } from "@jest/globals";
import { authClient } from "../../src/services/auth-client.js";
import { config } from "../../src/config/env.js";

describe("Auth Client Service Unit Tests", () => {
  const baseUrl = config.authServiceUrl;
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true }),
    });
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("checkHealth should call GET /health", async () => {
    const result = await authClient.checkHealth();

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(result.status).toBe(200);
  });

  it("getMe should call GET /api/auth/me with Authorization header", async () => {
    const mockReq = {
      method: "GET",
      headers: { authorization: "Bearer token-123" },
    };
    await authClient.getMe(mockReq);

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
    });
  });

  it("sync should call POST /api/auth/sync with Authorization header", async () => {
    const mockReq = {
      method: "POST",
      headers: { authorization: "Bearer token-123" },
    };
    await authClient.sync(mockReq);

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/api/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
    });
  });

  it("adminRegister should call POST /api/auth/admin/register with body", async () => {
    const adminBody = { name: "Admin Name" };
    const mockReq = {
      method: "POST",
      headers: { authorization: "Bearer token-123" },
      body: adminBody,
    };
    await authClient.adminRegister(mockReq);

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/api/auth/admin/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
      body: JSON.stringify(adminBody),
    });
  });

  it("createStaff should call POST /api/auth/staff with body", async () => {
    const staffBody = { name: "Staff Name", email: "staff@example.com", password: "Password123!" };
    const mockReq = {
      method: "POST",
      headers: { authorization: "Bearer token-123" },
      body: staffBody,
    };
    await authClient.createStaff(mockReq);

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/api/auth/staff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
      body: JSON.stringify(staffBody),
    });
  });

  it("listStaff should call GET /api/auth/staff with Authorization header", async () => {
    const mockReq = {
      method: "GET",
      headers: { authorization: "Bearer token-123" },
    };
    await authClient.listStaff(mockReq);

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/api/auth/staff`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
    });
  });

  it("getStaff should call GET /api/auth/staff/:firebaseUid with URL encoding", async () => {
    const firebaseUid = "staff@uid#123";
    const mockReq = {
      method: "GET",
      headers: { authorization: "Bearer token-123" },
    };
    await authClient.getStaff(mockReq, firebaseUid);

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/auth/staff/${encodeURIComponent(firebaseUid)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        },
      }
    );
  });

  it("updateStaffStatus should call PATCH /api/auth/staff/:firebaseUid/status with body", async () => {
    const firebaseUid = "staff-uid-123";
    const updateBody = { isActive: false };
    const mockReq = {
      method: "PATCH",
      headers: { authorization: "Bearer token-123" },
      body: updateBody,
    };
    await authClient.updateStaffStatus(mockReq, firebaseUid);

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/auth/staff/${encodeURIComponent(firebaseUid)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        },
        body: JSON.stringify(updateBody),
      }
    );
  });

  it("revokeStaff should call POST /api/auth/staff/:firebaseUid/revoke", async () => {
    const firebaseUid = "staff-uid-123";
    const mockReq = {
      method: "POST",
      headers: { authorization: "Bearer token-123" },
    };
    await authClient.revokeStaff(mockReq, firebaseUid);

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/auth/staff/${encodeURIComponent(firebaseUid)}/revoke`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        },
      }
    );
  });
});

