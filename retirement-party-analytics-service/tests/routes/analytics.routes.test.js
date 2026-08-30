import request from "supertest";
import { jest } from "@jest/globals";
import app from "../../src/app.js";
import { analyticsService } from "../../src/services/analytics.service.js";

describe("Analytics Routes (Supertest)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("Authorization", () => {
    it("should reject with 403 if role header is non-ADMIN", async () => {
      const res = await request(app)
        .get("/analytics/summary")
        .set("X-User-Role", "STAFF");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });

  describe("GET /analytics/summary", () => {
    it("should return 200 with summary data and timing headers", async () => {
      jest.spyOn(analyticsService, "getSummary").mockResolvedValue({
        data: {
          registrations: { total: 50, attending: 40, notAttending: 10 },
          attendance: { expectedAttendees: 60, totalAttended: 45, remaining: 15, attendancePercentage: 75 },
          meals: { vegetarian: 35, nonVegetarian: 25 },
        },
        cacheHit: false,
        databaseDurationMs: 12.5,
      });

      const res = await request(app).get("/analytics/summary");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.registrations.total).toBe(50);
      expect(res.headers["x-analytics-duration-ms"]).toBeDefined();
      expect(res.headers["x-cache"]).toBe("MISS");
    });
  });

  describe("GET /analytics/registrations", () => {
    it("should return 200 with registration metrics", async () => {
      jest.spyOn(analyticsService, "getRegistrations").mockResolvedValue({
        data: { total: 100, attending: 80, notAttending: 20 },
        databaseDurationMs: 5.2,
      });

      const res = await request(app).get("/analytics/registrations");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(100);
    });
  });

  describe("GET /analytics/attendance", () => {
    it("should return 200 with attendance metrics", async () => {
      jest.spyOn(analyticsService, "getAttendance").mockResolvedValue({
        data: { expectedAttendees: 120, totalAttended: 90, remaining: 30, attendancePercentage: 75 },
        databaseDurationMs: 8.1,
      });

      const res = await request(app).get("/analytics/attendance");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expectedAttendees).toBe(120);
    });
  });

  describe("GET /analytics/meals", () => {
    it("should return 200 with meal breakdown", async () => {
      jest.spyOn(analyticsService, "getMeals").mockResolvedValue({
        data: { vegetarian: 70, nonVegetarian: 50 },
        databaseDurationMs: 6.4,
      });

      const res = await request(app).get("/analytics/meals");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vegetarian).toBe(70);
    });
  });

  describe("GET /analytics/checkins", () => {
    it("should return 200 with checkin stats", async () => {
      jest.spyOn(analyticsService, "getCheckins").mockResolvedValue({
        data: { total: 90, today: 40 },
        databaseDurationMs: 4.3,
      });

      const res = await request(app).get("/analytics/checkins");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(90);
    });
  });

  describe("GET /analytics/checkins/trend", () => {
    it("should return 200 with trend items", async () => {
      jest.spyOn(analyticsService, "getCheckinTrend").mockResolvedValue({
        data: { granularity: "hour", items: [{ date: "2026-08-30 10:00", count: 12 }] },
        databaseDurationMs: 7.9,
      });

      const res = await request(app)
        .get("/analytics/checkins/trend")
        .query({ from: "2026-08-01", to: "2026-08-30", granularity: "hour" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
    });

    it("should return 400 for invalid date query", async () => {
      const res = await request(app)
        .get("/analytics/checkins/trend")
        .query({ from: "2026-08-30", to: "2026-08-01" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /analytics/staff/checkins", () => {
    it("should return 200 with staff leaderboard", async () => {
      jest.spyOn(analyticsService, "getStaffCheckins").mockResolvedValue({
        data: { items: [{ staffId: "uid-1", staffName: "Staff One", checkIns: 30 }] },
        databaseDurationMs: 9.0,
      });

      const res = await request(app).get("/analytics/staff/checkins");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].staffName).toBe("Staff One");
    });
  });

  describe("GET /analytics/checkins/recent", () => {
    it("should return 200 with recent checkins", async () => {
      jest.spyOn(analyticsService, "getRecentCheckins").mockResolvedValue({
        data: { items: [{ id: "c1", guestName: "Jane Doe" }] },
        databaseDurationMs: 4.8,
      });

      const res = await request(app)
        .get("/analytics/checkins/recent")
        .query({ limit: "5" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
    });
  });

  describe("GET /analytics/metrics", () => {
    it("should return operational metrics snapshot", async () => {
      const res = await request(app).get("/analytics/metrics");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.counters).toBeDefined();
    });
  });
});

