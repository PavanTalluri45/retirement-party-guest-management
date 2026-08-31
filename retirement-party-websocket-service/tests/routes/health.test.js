import request from "supertest";
import app from "../../src/app.js";

describe("Health & Metrics Routes", () => {
  it("GET /health returns 200 with service info", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        service: "retirement-party-websocket-service",
        status: "healthy",
      })
    );
  });

  it("GET /health/metrics returns 200 with metrics counters", async () => {
    const res = await request(app).get("/health/metrics");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        totalConnections: expect.any(Number),
        activeConnections: expect.any(Number),
        adminConnections: expect.any(Number),
        eventsReceived: expect.any(Number),
        eventsBroadcast: expect.any(Number),
      })
    );
  });

  it("GET / returns 200 with welcome message", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body.service).toBe("retirement-party-websocket-service");
  });
});

