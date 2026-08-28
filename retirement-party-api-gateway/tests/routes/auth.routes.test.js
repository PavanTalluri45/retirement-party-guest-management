import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import { adminAuth } from "../../src/config/firebase.js";
import { authClient } from "../../src/services/auth-client.js";
import { ProxyError } from "../../src/utils/proxy-request.js";

describe("Auth Routes Integration Tests (Supertest)", () => {
  const validToken = "mock-valid-firebase-jwt";
  const mockDecodedUser = {
    uid: "test-firebase-uid-100",
    email: "admin@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Unauthenticated Requests (Missing or Invalid Token)", () => {
    it("GET /auth/me without token should return 401", async () => {
      const res = await request(app).get("/auth/me");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: "Authentication required.",
      });
    });

    it("POST /auth/sync without token should return 401", async () => {
      const res = await request(app).post("/auth/sync");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /auth/admin/register without token should return 401", async () => {
      const res = await request(app)
        .post("/auth/admin/register")
        .send({ name: "Admin" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /auth/staff without token should return 401", async () => {
      const res = await request(app)
        .post("/auth/staff")
        .send({ name: "Staff", email: "staff@example.com", password: "Password123!" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /auth/staff without token should return 401", async () => {
      const res = await request(app).get("/auth/staff");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /auth/staff/:uid without token should return 401", async () => {
      const res = await request(app).get("/auth/staff/some-uid");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("PATCH /auth/staff/:uid/status without token should return 401", async () => {
      const res = await request(app)
        .patch("/auth/staff/some-uid/status")
        .send({ isActive: false });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /auth/staff/:uid/revoke without token should return 401", async () => {
      const res = await request(app).post("/auth/staff/some-uid/revoke");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Authenticated Route Forwarding (Mocked Firebase)", () => {
    beforeEach(() => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValue(mockDecodedUser);
    });

    it("GET /auth/me should verify token and return current user", async () => {
      const mockProfile = {
        success: true,
        data: {
          user: {
            id: "mongo-user-id",
            firebaseUid: mockDecodedUser.uid,
            name: "Admin User",
            email: mockDecodedUser.email,
            role: "ADMIN",
            isActive: true,
          },
        },
      };

      jest.spyOn(authClient, "getMe").mockResolvedValueOnce({
        status: 200,
        data: mockProfile,
      });

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith(validToken, true);
      expect(authClient.getMe).toHaveBeenCalledTimes(1);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockProfile);
    });

    it("POST /auth/sync should verify token and forward sync request", async () => {
      const mockSyncResult = {
        success: true,
        data: {
          user: {
            firebaseUid: mockDecodedUser.uid,
            lastLoginAt: new Date().toISOString(),
          },
        },
      };

      jest.spyOn(authClient, "sync").mockResolvedValueOnce({
        status: 200,
        data: mockSyncResult,
      });

      const res = await request(app)
        .post("/auth/sync")
        .set("Authorization", `Bearer ${validToken}`);

      expect(authClient.sync).toHaveBeenCalledTimes(1);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSyncResult);
    });

    it("POST /auth/admin/register should forward admin registration body", async () => {
      const adminData = { name: "Test Admin" };
      const mockRegisterResult = {
        success: true,
        data: {
          user: {
            firebaseUid: mockDecodedUser.uid,
            name: "Test Admin",
            role: "ADMIN",
          },
        },
      };

      jest.spyOn(authClient, "adminRegister").mockResolvedValueOnce({
        status: 201,
        data: mockRegisterResult,
      });

      const res = await request(app)
        .post("/auth/admin/register")
        .set("Authorization", `Bearer ${validToken}`)
        .send(adminData);

      expect(authClient.adminRegister).toHaveBeenCalledTimes(1);
      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockRegisterResult);
    });

    it("POST /auth/staff should forward new staff payload", async () => {
      const staffPayload = {
        name: "Test Staff",
        email: "staff@example.com",
        password: "Password123!",
      };
      const mockCreateResult = {
        success: true,
        message: "Staff member created successfully",
        data: {
          staff: {
            firebaseUid: "new-staff-uid",
            name: "Test Staff",
            email: "staff@example.com",
            role: "STAFF",
          },
        },
      };

      jest.spyOn(authClient, "createStaff").mockResolvedValueOnce({
        status: 201,
        data: mockCreateResult,
      });

      const res = await request(app)
        .post("/auth/staff")
        .set("Authorization", `Bearer ${validToken}`)
        .send(staffPayload);

      expect(authClient.createStaff).toHaveBeenCalledTimes(1);
      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockCreateResult);
    });

    it("GET /auth/staff should return list of staff members", async () => {
      const mockListResult = {
        success: true,
        data: {
          staff: [
            { firebaseUid: "staff-1", name: "Staff One", role: "STAFF", isActive: true },
            { firebaseUid: "staff-2", name: "Staff Two", role: "STAFF", isActive: false },
          ],
        },
      };

      jest.spyOn(authClient, "listStaff").mockResolvedValueOnce({
        status: 200,
        data: mockListResult,
      });

      const res = await request(app)
        .get("/auth/staff")
        .set("Authorization", `Bearer ${validToken}`);

      expect(authClient.listStaff).toHaveBeenCalledTimes(1);
      expect(res.status).toBe(200);
      expect(res.body.data.staff).toHaveLength(2);
    });

    it("GET /auth/staff/:uid should return specific staff member", async () => {
      const targetUid = "target-staff-123";
      const mockStaffResult = {
        success: true,
        data: {
          staff: { firebaseUid: targetUid, name: "Staff Member", role: "STAFF" },
        },
      };

      jest.spyOn(authClient, "getStaff").mockResolvedValueOnce({
        status: 200,
        data: mockStaffResult,
      });

      const res = await request(app)
        .get(`/auth/staff/${targetUid}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(authClient.getStaff).toHaveBeenCalledWith(expect.anything(), targetUid);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStaffResult);
    });

    it("PATCH /auth/staff/:uid/status should update staff active status", async () => {
      const targetUid = "target-staff-123";
      const statusPayload = { isActive: false };
      const mockStatusResult = {
        success: true,
        data: {
          staff: { firebaseUid: targetUid, isActive: false },
        },
      };

      jest.spyOn(authClient, "updateStaffStatus").mockResolvedValueOnce({
        status: 200,
        data: mockStatusResult,
      });

      const res = await request(app)
        .patch(`/auth/staff/${targetUid}/status`)
        .set("Authorization", `Bearer ${validToken}`)
        .send(statusPayload);

      expect(authClient.updateStaffStatus).toHaveBeenCalledWith(expect.anything(), targetUid);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStatusResult);
    });

    it("POST /auth/staff/:uid/revoke should forward session revocation", async () => {
      const targetUid = "target-staff-123";
      const mockRevokeResult = {
        success: true,
        message: "Staff user sessions revoked successfully",
      };

      jest.spyOn(authClient, "revokeStaff").mockResolvedValueOnce({
        status: 200,
        data: mockRevokeResult,
      });

      const res = await request(app)
        .post(`/auth/staff/${targetUid}/revoke`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(authClient.revokeStaff).toHaveBeenCalledWith(expect.anything(), targetUid);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRevokeResult);
    });
  });

  describe("Service Unavailable / Downstream Network Failure", () => {
    it("should return 502 if downstream Auth Service is unreachable", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(mockDecodedUser);
      jest.spyOn(authClient, "getMe").mockRejectedValueOnce(
        new ProxyError("Connection failed", new Error("connect ECONNREFUSED 127.0.0.1:5000"))
      );

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(502);
      expect(res.body).toEqual({
        success: false,
        message: "Authentication service is temporarily unavailable. Please try again shortly.",
      });
    });
  });
});

