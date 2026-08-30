import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import { adminAuth } from "../../src/config/firebase.js";
import { authClient } from "../../src/services/auth-client.js";
import { analyticsClient } from "../../src/services/analytics-client.js";

describe("Gateway Analytics Routes Tests (Supertest)", () => {
  const validToken = "mock-admin-token";
  const mockAdminUser = {
    uid: "admin-uid-123",
    email: "admin@example.com",
    role: "ADMIN",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/analytics/summary");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 403 when authenticated user is STAFF (non-admin)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce({
        uid: "staff-uid-456",
        email: "staff@example.com",
      });

      jest.spyOn(authClient, "getMe").mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            user: { role: "STAFF" },
          },
        },
      });

      const res = await request(app)
        .get("/analytics/summary")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });

  describe("Forwarding Analytics Requests", () => {
    beforeEach(() => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValue({
        uid: mockAdminUser.uid,
        email: mockAdminUser.email,
        role: "ADMIN",
      });
    });

    it("GET /analytics/summary should proxy response with timing headers", async () => {
      const mockSummaryData = {
        success: true,
        data: {
          registrations: { total: 50, attending: 40, notAttending: 10 },
          attendance: { expectedAttendees: 60, totalAttended: 45, remaining: 15, attendancePercentage: 75 },
          meals: { vegetarian: 35, nonVegetarian: 25 },
        },
      };

      jest.spyOn(analyticsClient, "getSummary").mockResolvedValueOnce({
        status: 200,
        data: mockSummaryData,
        headers: {
          "server-timing": "total;dur=15",
          "x-analytics-duration-ms": "15",
          "x-cache": "MISS",
        },
      });

      const res = await request(app)
        .get("/analytics/summary")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSummaryData);
      expect(res.headers["server-timing"]).toBe("total;dur=15");
      expect(res.headers["x-analytics-duration-ms"]).toBe("15");
    });

    it("GET /api/analytics/summary alias should work identically", async () => {
      const mockSummaryData = { success: true, data: { test: true } };

      jest.spyOn(analyticsClient, "getSummary").mockResolvedValueOnce({
        status: 200,
        data: mockSummaryData,
      });

      const res = await request(app)
        .get("/api/analytics/summary")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSummaryData);
    });

    it("GET /analytics/registrations should proxy registrations response", async () => {
      jest.spyOn(analyticsClient, "getRegistrations").mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { total: 100 } },
      });

      const res = await request(app)
        .get("/analytics/registrations")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(100);
    });

    it("GET /analytics/attendance should proxy attendance response", async () => {
      jest.spyOn(analyticsClient, "getAttendance").mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { expectedAttendees: 80 } },
      });

      const res = await request(app)
        .get("/analytics/attendance")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.expectedAttendees).toBe(80);
    });

    it("GET /analytics/meals should proxy meals response", async () => {
      jest.spyOn(analyticsClient, "getMeals").mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { vegetarian: 50, nonVegetarian: 30 } },
      });

      const res = await request(app)
        .get("/analytics/meals")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.vegetarian).toBe(50);
    });

    it("GET /analytics/checkins should proxy checkins response", async () => {
      jest.spyOn(analyticsClient, "getCheckins").mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { total: 45, today: 20 } },
      });

      const res = await request(app)
        .get("/analytics/checkins")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(45);
    });

    it("GET /analytics/checkins/trend should proxy trend response", async () => {
      jest.spyOn(analyticsClient, "getCheckinTrend").mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { items: [] } },
      });

      const res = await request(app)
        .get("/analytics/checkins/trend?from=2026-08-01&to=2026-08-30")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });

    it("GET /analytics/staff/checkins should proxy staff response", async () => {
      jest.spyOn(analyticsClient, "getStaffCheckins").mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { items: [] } },
      });

      const res = await request(app)
        .get("/analytics/staff/checkins")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });

    it("GET /analytics/checkins/recent should proxy recent checkins response", async () => {
      jest.spyOn(analyticsClient, "getRecentCheckins").mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { items: [] } },
      });

      const res = await request(app)
        .get("/analytics/checkins/recent?limit=10")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });

    it("GET /analytics/health should return health without authentication", async () => {
      jest.spyOn(analyticsClient, "getHealth").mockResolvedValueOnce({
        status: 200,
        data: { success: true, status: "healthy" },
      });

      const res = await request(app).get("/analytics/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("healthy");
    });
  });
});

