import request from "supertest";
import { jest } from "@jest/globals";
import app from "../../src/app.js";
import { setDb } from "../../src/config/database.js";
import { setRedisClient } from "../../src/config/redis.js";

describe("Health & Root Routes", () => {
  beforeEach(() => {
    // Inject mock DB
    const mockDb = {
      collection: () => ({
        createIndex: jest.fn().mockResolvedValue(true),
      }),
      command: jest.fn().mockResolvedValue({ ok: 1 }),
    };
    setDb(mockDb);
    setRedisClient(null);
  });

  it("GET / should return service information", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("retirement-party-analytics-service");
  });

  it("GET /health should return health status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("retirement-party-analytics-service");
    expect(res.body.dependencies).toBeDefined();
  });

  it("GET /unknown-route should return 404", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
