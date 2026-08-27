import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Gateway Health Routes", () => {
  it("GET /health should return 200 with gateway status", async () => {
    const res = await request(app).get("/health");

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.service, "retirement-party-api-gateway");
    assert.equal(res.body.status, "healthy");
  });

  it("GET / should return 200 welcome message", async () => {
    const res = await request(app).get("/");

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.service, "retirement-party-api-gateway");
  });

  it("GET /non-existent-route should return 404", async () => {
    const res = await request(app).get("/non-existent-route");

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Route not found/i);
  });
});

