import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import { setRedisClient } from "../../src/config/redis.js";
import { setDb } from "../../src/config/database.js";
import { registrationClient } from "../../src/clients/registration-client.js";
import { metricsService } from "../../src/services/metrics.service.js";


describe("Verification Service API Routes", () => {
  let mockRedis;
  let mockDb;
  let mockGuestsCol;
  let mockCheckinsCol;
  let mockUsersCol;

  beforeEach(() => {
    metricsService.reset();

    // Mock Redis
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      ping: jest.fn().mockResolvedValue("PONG"),
    };
    setRedisClient(mockRedis);

    // Mock MongoDB collections
    mockGuestsCol = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      createIndex: jest.fn().mockResolvedValue("idx"),
    };

    mockCheckinsCol = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: "checkin-id-1" }),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      }),
      countDocuments: jest.fn().mockResolvedValue(0),
      findOne: jest.fn().mockResolvedValue(null),
      createIndex: jest.fn().mockResolvedValue("idx"),
    };

    mockUsersCol = {
      findOne: jest.fn().mockResolvedValue({
        firebaseUid: "test-firebase-uid",
        name: "Test Staff",
        email: "staff@event.com",
        role: "STAFF",
        isActive: true,
      }),
    };

    mockDb = {
      collection: jest.fn((name) => {
        if (name === "guests") return mockGuestsCol;
        if (name === "checkins") return mockCheckinsCol;
        if (name === "users") return mockUsersCol;
        return { createIndex: jest.fn() };
      }),
      command: jest.fn().mockResolvedValue({ ok: 1 }),
    };

    setDb(mockDb);
  });

  describe("GET /health", () => {
    it("should return healthy status when MongoDB and Redis are reachable", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.success).toBeUndefined(); // raw health payload
      expect(res.body.status).toBe("healthy");
      expect(res.body.dependencies.mongodb).toBe("connected");
      expect(res.body.dependencies.redis).toBe("connected");
    });

    it("should return degraded (200) when Redis is down but MongoDB is up", async () => {
      mockRedis.ping.mockRejectedValue(new Error("Redis offline"));

      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("degraded");
      expect(res.body.dependencies.redis).toBe("unavailable");
      expect(res.body.dependencies.mongodb).toBe("connected");
    });
  });

  describe("GET /health/metrics", () => {
    it("should return metrics overview", async () => {
      const res = await request(app).get("/health/metrics");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service).toBe("retirement-party-verification-service");
      expect(res.body.data.counters).toBeDefined();
    });
  });

  describe("POST /verification/confirmation", () => {
    const authHeaders = { Authorization: "Bearer test-valid-token" };

    it("should verify guest on cache HIT from Redis without calling downstream registration service", async () => {
      const cachedGuest = {
        id: "507f1f77bcf86cd799439011",
        name: "Pavan Kumar",
        phone: "9876543210",
        confirmationNumber: "0142",
        status: "REGISTERED",
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedGuest));
      jest.spyOn(registrationClient, "fetchGuestByConfirmation");

      const res = await request(app)
        .post("/verification/confirmation")
        .set(authHeaders)
        .send({ confirmationNumber: "0142" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guest.name).toBe("Pavan Kumar");
      expect(res.body.meta.cache).toBe("HIT");
      expect(registrationClient.fetchGuestByConfirmation).not.toHaveBeenCalled();
      expect(res.headers["server-timing"]).toBeDefined();
    });

    it("should query Registration Service and cache result on cache MISS", async () => {
      mockRedis.get.mockResolvedValue(null);
      const downstreamGuest = {
        id: "507f1f77bcf86cd799439011",
        name: "Pavan Kumar",
        phone: "9876543210",
        confirmationNumber: "0142",
        familyCount: 2,
        attending: true,
      };
      jest
        .spyOn(registrationClient, "fetchGuestByConfirmation")
        .mockResolvedValue(downstreamGuest);

      const res = await request(app)
        .post("/verification/confirmation")
        .set(authHeaders)
        .send({ confirmationNumber: "0142" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guest.name).toBe("Pavan Kumar");
      expect(res.body.meta.cache).toBe("MISS");
      expect(registrationClient.fetchGuestByConfirmation).toHaveBeenCalledWith(
        "0142",
        expect.any(String)
      );
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it("should return 400 for invalid confirmation code format", async () => {
      const res = await request(app)
        .post("/verification/confirmation")
        .set(authHeaders)
        .send({ confirmationNumber: "12" }); // Not 4 digits

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 and write negative cache when guest is not found downstream", async () => {
      mockRedis.get.mockResolvedValue(null);
      const notFoundErr = new Error("Guest not found");
      notFoundErr.type = "NOT_FOUND";
      notFoundErr.status = 404;
      jest
        .spyOn(registrationClient, "fetchGuestByConfirmation")
        .mockRejectedValue(notFoundErr);

      const res = await request(app)
        .post("/verification/confirmation")
        .set(authHeaders)
        .send({ confirmationNumber: "9999" });

      expect(res.status).toBe(404);
      expect(mockRedis.set).toHaveBeenCalledWith(
        "verification:v1:guest:confirmation:9999",
        JSON.stringify({ notFound: true }),
        { ex: 10 }
      );
    });
  });

  describe("POST /verification/phone", () => {
    const authHeaders = { Authorization: "Bearer test-valid-token" };

    it("should verify guest by 10-digit phone number on cache miss", async () => {
      mockRedis.get.mockResolvedValue(null);
      const downstreamGuest = {
        id: "507f1f77bcf86cd799439011",
        name: "Jane Doe",
        phone: "9876543210",
        confirmationNumber: "0555",
      };
      jest
        .spyOn(registrationClient, "fetchGuestByPhone")
        .mockResolvedValue(downstreamGuest);

      const res = await request(app)
        .post("/verification/phone")
        .set(authHeaders)
        .send({ phone: "9876543210" });

      expect(res.status).toBe(200);
      expect(res.body.data.guest.name).toBe("Jane Doe");
      expect(res.body.meta.cache).toBe("MISS");
    });
  });

  describe("POST /verification/check-in", () => {
    const authHeaders = { Authorization: "Bearer test-valid-token" };

    it("should perform authoritative atomic check-in and invalidate both Redis keys", async () => {
      const existingGuest = {
        _id: "507f1f77bcf86cd799439011",
        name: "Pavan Kumar",
        phone: "9876543210",
        confirmationNumber: "0142",
        attending: true,
        familyCount: 2,
        checkedIn: false,
      };
      mockGuestsCol.findOne.mockResolvedValue(existingGuest);
      mockGuestsCol.findOneAndUpdate.mockResolvedValue({
        ...existingGuest,
        checkedIn: true,
        status: "CHECKED_IN",
      });

      const res = await request(app)
        .post("/verification/check-in")
        .set(authHeaders)
        .send({
          verificationMethod: "CONFIRMATION",
          value: "0142",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guest.status).toBe("CHECKED_IN");
      expect(mockCheckinsCol.insertOne).toHaveBeenCalled();
      // Verify dual-key invalidation
      expect(mockRedis.del).toHaveBeenCalledWith(
        "verification:v1:guest:phone:9876543210",
        "verification:v1:guest:confirmation:0142"
      );
    });

    it("should return 409 Conflict when guest is already checked in", async () => {
      const alreadyCheckedGuest = {
        _id: "507f1f77bcf86cd799439011",
        name: "Pavan Kumar",
        phone: "9876543210",
        confirmationNumber: "0142",
        attending: true,
        checkedIn: true,
      };
      mockGuestsCol.findOne.mockResolvedValue(alreadyCheckedGuest);
      mockGuestsCol.findOneAndUpdate.mockResolvedValue(null); // Concurrency / pre-condition fail

      const res = await request(app)
        .post("/verification/check-in")
        .set(authHeaders)
        .send({
          verificationMethod: "CONFIRMATION",
          value: "0142",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already been checked in/i);
    });
  });

  describe("GET /verification/history/me", () => {
    const authHeaders = { Authorization: "Bearer test-valid-token" };

    it("should return paginated check-in records for current staff member with summary", async () => {
      const mockRecords = [
        {
          _id: "chk-1",
          guestId: "g1",
          guestName: "Alice",
          checkedInBy: "test-firebase-uid",
          checkedInAt: new Date(),
          result: "SUCCESS",
        },
      ];
      mockCheckinsCol.find().toArray.mockResolvedValue(mockRecords);
      mockCheckinsCol.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get("/verification/history/me?page=1&limit=10")
        .set(authHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkins.length).toBe(1);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data.summary).toBeDefined();
    });
  });
});
