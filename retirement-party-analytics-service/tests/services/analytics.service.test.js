import { jest } from "@jest/globals";
import { AnalyticsService } from "../../src/services/analytics.service.js";

describe("AnalyticsService", () => {
  let mockRepo;
  let mockCache;
  let service;

  beforeEach(() => {
    mockRepo = {
      getRegistrationStats: jest.fn().mockResolvedValue({ total: 100, attending: 80, notAttending: 20 }),
      getAttendanceSummary: jest.fn().mockResolvedValue({
        expectedAttendees: 150,
        totalAttended: 100,
        remaining: 50,
        attendancePercentage: 66.67,
      }),
      getMealStats: jest.fn().mockResolvedValue({ vegetarian: 90, nonVegetarian: 60 }),
      getCheckinStats: jest.fn().mockResolvedValue({ total: 100, today: 45 }),
      getCheckinTrend: jest.fn().mockResolvedValue({ granularity: "hour", items: [{ date: "2026-08-30 10:00", count: 10 }] }),
      getStaffCheckinStats: jest.fn().mockResolvedValue({ items: [{ staffId: "u1", staffName: "Alice", checkIns: 25 }] }),
      getRecentCheckins: jest.fn().mockResolvedValue({ items: [{ id: "c1", guestName: "John" }] }),
    };

    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    };

    service = new AnalyticsService(mockRepo, mockCache);
  });

  describe("getSummary()", () => {
    it("should compute and return fresh summary on cache MISS", async () => {
      const result = await service.getSummary();

      expect(mockCache.get).toHaveBeenCalledWith("analytics:v1:summary");
      expect(mockRepo.getRegistrationStats).toHaveBeenCalled();
      expect(mockRepo.getAttendanceSummary).toHaveBeenCalled();
      expect(mockRepo.getMealStats).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith("analytics:v1:summary", result.data);

      expect(result.cacheHit).toBe(false);
      expect(result.data.registrations.total).toBe(100);
      expect(result.data.attendance.expectedAttendees).toBe(150);
      expect(result.data.meals.vegetarian).toBe(90);
    });

    it("should return cached summary on cache HIT without querying repository", async () => {
      const cachedData = {
        registrations: { total: 10, attending: 8, notAttending: 2 },
        attendance: { expectedAttendees: 15, totalAttended: 5, remaining: 10, attendancePercentage: 33.33 },
        meals: { vegetarian: 10, nonVegetarian: 5 },
      };
      mockCache.get.mockResolvedValueOnce(cachedData);

      const result = await service.getSummary();

      expect(result.cacheHit).toBe(true);
      expect(result.data).toEqual(cachedData);
      expect(mockRepo.getRegistrationStats).not.toHaveBeenCalled();
      expect(mockRepo.getAttendanceSummary).not.toHaveBeenCalled();
      expect(mockRepo.getMealStats).not.toHaveBeenCalled();
    });
  });

  describe("Individual endpoints", () => {
    it("should get registrations from repository", async () => {
      const result = await service.getRegistrations();
      expect(mockRepo.getRegistrationStats).toHaveBeenCalled();
      expect(result.data.total).toBe(100);
      expect(result.databaseDurationMs).toBeGreaterThanOrEqual(0);
    });

    it("should get attendance from repository", async () => {
      const result = await service.getAttendance();
      expect(mockRepo.getAttendanceSummary).toHaveBeenCalled();
      expect(result.data.attendancePercentage).toBe(66.67);
    });

    it("should get meals from repository", async () => {
      const result = await service.getMeals();
      expect(mockRepo.getMealStats).toHaveBeenCalled();
      expect(result.data.vegetarian).toBe(90);
    });

    it("should get checkins from repository", async () => {
      const result = await service.getCheckins();
      expect(mockRepo.getCheckinStats).toHaveBeenCalled();
      expect(result.data.today).toBe(45);
    });

    it("should get checkin trend from repository", async () => {
      const result = await service.getCheckinTrend({ granularity: "hour" });
      expect(mockRepo.getCheckinTrend).toHaveBeenCalledWith({ granularity: "hour" });
      expect(result.data.items).toHaveLength(1);
    });

    it("should get staff checkins from repository", async () => {
      const result = await service.getStaffCheckins();
      expect(mockRepo.getStaffCheckinStats).toHaveBeenCalled();
      expect(result.data.items[0].staffName).toBe("Alice");
    });

    it("should get recent checkins from repository", async () => {
      const result = await service.getRecentCheckins(10);
      expect(mockRepo.getRecentCheckins).toHaveBeenCalledWith(10);
      expect(result.data.items[0].guestName).toBe("John");
    });
  });
});

