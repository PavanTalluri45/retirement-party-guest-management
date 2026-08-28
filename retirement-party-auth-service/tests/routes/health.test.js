import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import { setDb } from "../../src/config/database.js";

describe("Health Routes Integration Tests (Supertest)", () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      command: jest.fn().mockResolvedValue({ ok: 1 }),
    };
    setDb(mockDb);
    jest.clearAllMocks();
  });

  it("GET / should return 200 welcome info", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        service: "retirement-party-auth-service",
        message: "Retirement Party Authentication Service is running",
      })
    );
  });

  it("GET /health should return 200 and healthy service/database status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("retirement-party-auth-service");
    expect(res.body.status).toBe("healthy");
    expect(res.body.database).toBe("connected");
    expect(res.body.timestamp).toBeDefined();
    expect(mockDb.command).toHaveBeenCalledWith({ ping: 1 });
  });

  it("GET /health should return 503 when database ping fails", async () => {
    mockDb.command.mockRejectedValueOnce(new Error("Mongo network error"));

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe("unhealthy");
    expect(res.body.database).toBe("disconnected");
    expect(res.body.error).toBe("Mongo network error");
  });

  it("GET /unknown-route should return 404 Route Not Found", async () => {
    const res = await request(app).get("/api/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Route not found/i);
  });
});

