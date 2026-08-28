import { jest } from "@jest/globals";
import { registrationClient } from "../../src/services/registration-client.js";
import { config } from "../../src/config/env.js";

describe("Registration Client Service Unit Tests", () => {
  const baseUrl = config.registrationServiceUrl;
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

  it("checkHealth should call GET /health on registration service", async () => {
    const result = await registrationClient.checkHealth();

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(result.status).toBe(200);
  });

  it("register should call POST /registrations with request body", async () => {
    const body = {
      name: "Ravi Kumar",
      phone: "9876543210",
      attending: true,
      familyCount: 1,
      mealPreference: "VEG",
      familyMembers: [],
    };
    const mockReq = {
      method: "POST",
      headers: {},
      body,
    };

    await registrationClient.register(mockReq);

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  });

  it("getByConfirmationNumber should call GET /registrations/confirmation/:confirmationNumber", async () => {
    const mockReq = {
      method: "GET",
      headers: {},
    };

    await registrationClient.getByConfirmationNumber(mockReq, "0142");

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/registrations/confirmation/0142`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  });

  it("getById should call GET /registrations/id/:id", async () => {
    const mockReq = {
      method: "GET",
      headers: {},
    };

    await registrationClient.getById(mockReq, "507f1f77bcf86cd799439011");

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/registrations/id/507f1f77bcf86cd799439011`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  });
});

