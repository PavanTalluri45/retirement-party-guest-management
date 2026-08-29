import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import { setRedisClient } from "../../src/config/redis.js";
import { setDb } from "../../src/config/database.js";


describe("Atomic Check-in Concurrency & Race Condition Protection", () => {
  let mockRedis;
  let mockDb;
  let guestState;
  let checkinRecords;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      ping: jest.fn().mockResolvedValue("PONG"),
    };
    setRedisClient(mockRedis);

    // Realistic stateful in-memory mock simulating MongoDB atomic findOneAndUpdate
    guestState = {
      _id: "507f1f77bcf86cd799439011",
      name: "Pavan Kumar",
      phone: "9876543210",
      confirmationNumber: "0142",
      attending: true,
      familyCount: 2,
      checkedIn: false,
    };
    checkinRecords = [];

    const mockGuestsCol = {
      findOne: jest.fn(async ({ _id, confirmationNumber }) => {
        if (
          _id?.toString() === guestState._id ||
          confirmationNumber === guestState.confirmationNumber
        ) {
          return { ...guestState };
        }
        return null;
      }),
      findOneAndUpdate: jest.fn(async (filter, update) => {
        // Atomic compare-and-swap simulation
        if (guestState.checkedIn === true) {
          return null; // Atomic condition failed: already checked in!
        }
        // State mutation
        guestState.checkedIn = true;
        guestState.checkedInAt = new Date();
        guestState.status = "CHECKED_IN";
        return { ...guestState };
      }),
      createIndex: jest.fn().mockResolvedValue("idx"),
    };

    const mockCheckinsCol = {
      insertOne: jest.fn(async (doc) => {
        checkinRecords.push(doc);
        return { insertedId: `chk_${checkinRecords.length}` };
      }),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(checkinRecords),
      }),
      countDocuments: jest.fn(async () => checkinRecords.length),
      findOne: jest.fn(async () => checkinRecords[0] || null),
      createIndex: jest.fn().mockResolvedValue("idx"),
    };

    const mockUsersCol = {
      findOne: jest.fn(async ({ firebaseUid }) => ({
        firebaseUid,
        name: `Staff ${firebaseUid}`,
        email: `${firebaseUid}@event.com`,
        role: "STAFF",
        isActive: true,
      })),
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

  it("should ensure exactly 1 of concurrent check-in requests succeeds (200) and the other fails with 409 Conflict", async () => {
    const staffAHeaders = { Authorization: "Bearer staff-A-token" };
    const staffBHeaders = { Authorization: "Bearer staff-B-token" };

    const payload = {
      verificationMethod: "CONFIRMATION",
      value: "0142",
    };

    // Execute concurrent check-ins simultaneously
    const [responseA, responseB] = await Promise.all([
      request(app).post("/verification/check-in").set(staffAHeaders).send(payload),
      request(app).post("/verification/check-in").set(staffBHeaders).send(payload),
    ]);

    const statuses = [responseA.status, responseB.status].sort();

    // Exactly one 200 OK and one 409 Conflict
    expect(statuses).toEqual([200, 409]);

    // Exactly one checkin record in MongoDB
    expect(checkinRecords.length).toBe(1);

    // Dual-key cache invalidation executed
    expect(mockRedis.del).toHaveBeenCalledWith(
      "verification:v1:guest:phone:9876543210",
      "verification:v1:guest:confirmation:0142"
    );
  });
});
