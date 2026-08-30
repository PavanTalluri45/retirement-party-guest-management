import { jest } from "@jest/globals";
import analyticsRepository from "../../src/repositories/analytics.repository.js";
import { setDb } from "../../src/config/database.js";

describe("Analytics Repository", () => {
  let mockDb;
  let mockGuestsCol;
  let mockCheckinsCol;
  let mockUsersCol;

  beforeEach(() => {
    mockGuestsCol = {
      createIndex: jest.fn().mockResolvedValue("index_created"),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      }),
    };

    mockCheckinsCol = {
      createIndex: jest.fn().mockResolvedValue("index_created"),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      }),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        project: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      }),
    };

    mockUsersCol = {
      createIndex: jest.fn().mockResolvedValue("index_created"),
    };

    mockDb = {
      collection: jest.fn((name) => {
        if (name === "guests") return mockGuestsCol;
        if (name === "checkins") return mockCheckinsCol;
        if (name === "users") return mockUsersCol;
        return null;
      }),
    };

    setDb(mockDb);
  });

  it("ensureIndexes should create required indexes on all collections", async () => {
    await analyticsRepository.ensureIndexes();

    expect(mockGuestsCol.createIndex).toHaveBeenCalledTimes(2);
    expect(mockCheckinsCol.createIndex).toHaveBeenCalledTimes(2);
    expect(mockUsersCol.createIndex).toHaveBeenCalledTimes(1);
  });

  it("getRegistrationStats should aggregate guest counts", async () => {
    mockGuestsCol.aggregate.mockReturnValueOnce({
      toArray: jest.fn().mockResolvedValue([
        { total: 50, attending: 40, notAttending: 10 },
      ]),
    });

    const result = await analyticsRepository.getRegistrationStats();
    expect(result).toEqual({ total: 50, attending: 40, notAttending: 10 });
  });

  it("getAttendanceSummary should calculate expected and attended counts", async () => {
    mockGuestsCol.aggregate.mockReturnValueOnce({
      toArray: jest.fn().mockResolvedValue([{ expectedAttendees: 80 }]),
    });
    mockCheckinsCol.countDocuments.mockResolvedValueOnce(60);

    const result = await analyticsRepository.getAttendanceSummary();
    expect(result.expectedAttendees).toBe(80);
    expect(result.totalAttended).toBe(60);
    expect(result.remaining).toBe(20);
    expect(result.attendancePercentage).toBe(75);
  });

  it("getMealStats should count vegetarian and nonVegetarian meals", async () => {
    mockGuestsCol.aggregate.mockReturnValueOnce({
      toArray: jest.fn().mockResolvedValue([
        {
          primaryMeals: [{ _id: "VEG", count: 20 }, { _id: "NON_VEG", count: 10 }],
          familyMeals: [{ _id: "VEG", count: 5 }, { _id: "NON_VEG", count: 5 }],
        },
      ]),
    });

    const result = await analyticsRepository.getMealStats();
    expect(result).toEqual({ vegetarian: 25, nonVegetarian: 15 });
  });

  it("getCheckinStats should count total and today's check-ins", async () => {
    mockCheckinsCol.countDocuments
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(35); // today

    const result = await analyticsRepository.getCheckinStats();
    expect(result).toEqual({ total: 100, today: 35 });
  });

  it("getCheckinTrend should return aggregated time buckets", async () => {
    mockCheckinsCol.aggregate.mockReturnValueOnce({
      toArray: jest.fn().mockResolvedValue([
        { date: "2026-08-30", count: 50 },
      ]),
    });

    const result = await analyticsRepository.getCheckinTrend({ granularity: "day" });
    expect(result.granularity).toBe("day");
    expect(result.items).toEqual([{ date: "2026-08-30", count: 50 }]);
  });

  it("getStaffCheckinStats should aggregate staff leaderboard", async () => {
    mockCheckinsCol.aggregate.mockReturnValueOnce({
      toArray: jest.fn().mockResolvedValue([
        { staffId: "uid-1", staffName: "Alice", staffEmail: "alice@test.com", checkIns: 20 },
      ]),
    });

    const result = await analyticsRepository.getStaffCheckinStats();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].staffName).toBe("Alice");
  });

  it("getRecentCheckins should format recent check-in documents", async () => {
    const fakeTime = new Date("2026-08-30T10:00:00Z");
    mockCheckinsCol.find().project().toArray.mockResolvedValueOnce([
      {
        _id: "60d5ecb8b392d7001f8e1234",
        guestId: "g1",
        guestName: "Bob",
        confirmationNumber: "1234",
        familyCount: 2,
        mealPreference: "VEG",
        verificationMethod: "phone",
        checkedInByName: "Alice",
        checkedInAt: fakeTime,
      },
    ]);

    const result = await analyticsRepository.getRecentCheckins(5);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].guestName).toBe("Bob");
    expect(result.items[0].checkedInAt).toBe(fakeTime.toISOString());
  });
});

