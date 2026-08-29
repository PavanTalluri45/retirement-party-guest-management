import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import { authClient } from "../../src/services/auth-client.js";
import { registrationClient } from "../../src/services/registration-client.js";
import { verificationClient } from "../../src/services/verification-client.js";

describe("Health Routes Integration Tests (Supertest)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET / should return 200 welcome info", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        service: "retirement-party-api-gateway",
        message: "Retirement Party API Gateway is active",
      })
    );
  });

  it("GET /health should return 200 and healthy gateway status with services list", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("retirement-party-api-gateway");
    expect(res.body.status).toBe("healthy");
    expect(res.body.services).toEqual(["auth", "registration", "verification"]);
    expect(res.body.timestamp).toBeDefined();
  });

  it("GET /health/auth should return 200 with downstream health when Auth Service is available", async () => {
    const mockAuthHealthData = {
      success: true,
      service: "retirement-party-auth-service",
      status: "healthy",
      database: "connected",
      timestamp: "2026-08-28T00:00:00.000Z",
    };

    jest.spyOn(authClient, "checkHealth").mockResolvedValueOnce({
      status: 200,
      data: mockAuthHealthData,
    });

    const res = await request(app).get("/health/auth");

    expect(res.status).toBe(200);
    expect(res.body.gateway).toBe("healthy");
    expect(res.body.authService).toEqual(mockAuthHealthData);
  });

  it("GET /health/auth should return 503 when downstream Auth Service is unreachable", async () => {
    jest.spyOn(authClient, "checkHealth").mockRejectedValueOnce(
      new Error("Failed to reach downstream service at http://localhost:5000/health")
    );

    const res = await request(app).get("/health/auth");

    expect(res.status).toBe(503);
    expect(res.body.gateway).toBe("healthy");
    expect(res.body.authService).toEqual({
      success: false,
      status: "unreachable",
      message: expect.stringContaining("Failed to reach downstream"),
    });
  });

  it("GET /health/registration should return 200 when Registration Service is healthy", async () => {
    const mockRegistrationHealthData = {
      success: true,
      service: "retirement-party-registration-service",
      status: "healthy",
      timestamp: "2026-08-28T00:00:00.000Z",
    };

    jest.spyOn(registrationClient, "checkHealth").mockResolvedValueOnce({
      status: 200,
      data: mockRegistrationHealthData,
    });

    const res = await request(app).get("/health/registration");

    expect(res.status).toBe(200);
    expect(res.body.gateway).toBe("healthy");
    expect(res.body.registrationService).toEqual(mockRegistrationHealthData);
  });

  it("GET /health/registration should return 503 when Registration Service is unreachable", async () => {
    jest.spyOn(registrationClient, "checkHealth").mockRejectedValueOnce(
      new Error("Failed to reach downstream service at http://localhost:5001/health")
    );

    const res = await request(app).get("/health/registration");

    expect(res.status).toBe(503);
    expect(res.body.gateway).toBe("healthy");
    expect(res.body.registrationService).toEqual({
      success: false,
      status: "unreachable",
      message: expect.stringContaining("Failed to reach downstream"),
    });
  });

  it("GET /health/verification should return 200 when Verification Service is healthy", async () => {
    const mockVerificationHealthData = {
      success: true,
      service: "retirement-party-verification-service",
      status: "healthy",
      timestamp: "2026-08-28T00:00:00.000Z",
    };

    jest.spyOn(verificationClient, "getHealth").mockResolvedValueOnce({
      status: 200,
      data: mockVerificationHealthData,
    });

    const res = await request(app).get("/health/verification");

    expect(res.status).toBe(200);
    expect(res.body.gateway).toBe("healthy");
    expect(res.body.verificationService).toEqual(mockVerificationHealthData);
  });

  it("GET /health/verification should return 503 when Verification Service is unreachable", async () => {
    jest.spyOn(verificationClient, "getHealth").mockRejectedValueOnce(
      new Error("Failed to reach downstream service at http://localhost:5002/health")
    );

    const res = await request(app).get("/health/verification");

    expect(res.status).toBe(503);
    expect(res.body.gateway).toBe("healthy");
    expect(res.body.verificationService).toEqual({
      success: false,
      status: "unreachable",
      message: expect.stringContaining("Failed to reach downstream"),
    });
  });

  it("GET /health/all should return 200 and overall healthy when all services are up", async () => {
    jest.spyOn(authClient, "checkHealth").mockResolvedValueOnce({
      status: 200,
      data: { success: true, service: "retirement-party-auth-service", status: "healthy" },
    });
    jest.spyOn(registrationClient, "checkHealth").mockResolvedValueOnce({
      status: 200,
      data: { success: true, service: "retirement-party-registration-service", status: "healthy" },
    });
    jest.spyOn(verificationClient, "getHealth").mockResolvedValueOnce({
      status: 200,
      data: { success: true, service: "retirement-party-verification-service", status: "healthy" },
    });

    const res = await request(app).get("/health/all");

    expect(res.status).toBe(200);
    expect(res.body.gateway).toBe("healthy");
    expect(res.body.overallStatus).toBe("healthy");
    expect(res.body.services.authService.status).toBe("healthy");
    expect(res.body.services.registrationService.status).toBe("healthy");
    expect(res.body.services.verificationService.status).toBe("healthy");
  });

  it("GET /health/all should return 207 and overall degraded when a downstream service is down", async () => {
    jest.spyOn(authClient, "checkHealth").mockResolvedValueOnce({
      status: 200,
      data: { success: true, status: "healthy" },
    });
    jest.spyOn(registrationClient, "checkHealth").mockRejectedValueOnce(
      new Error("Registration service unreachable")
    );
    jest.spyOn(verificationClient, "getHealth").mockResolvedValueOnce({
      status: 200,
      data: { success: true, status: "healthy" },
    });

    const res = await request(app).get("/health/all");

    expect(res.status).toBe(207);
    expect(res.body.gateway).toBe("healthy");
    expect(res.body.overallStatus).toBe("degraded");
    expect(res.body.services.authService.status).toBe("healthy");
    expect(res.body.services.registrationService.status).toBe("unreachable");
  });

  it("GET /unknown-route should return 404", async () => {
    const res = await request(app).get("/api/unknown-endpoint");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Route not found/i);
  });
});
