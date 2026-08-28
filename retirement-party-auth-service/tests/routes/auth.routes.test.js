import { jest } from "@jest/globals";
import { ObjectId } from "mongodb";
import request from "supertest";
import app from "../../src/app.js";
import { adminAuth } from "../../src/config/firebase.js";
import { setDb } from "../../src/config/database.js";

describe("Auth Routes Integration Tests (Supertest)", () => {
  const adminToken = "mock-admin-firebase-token";
  const staffToken = "mock-staff-firebase-token";

  const adminDecoded = {
    uid: "admin-firebase-uid-1",
    email: "admin@example.com",
  };

  const staffDecoded = {
    uid: "staff-firebase-uid-2",
    email: "staff@example.com",
  };

  const adminUser = {
    _id: new ObjectId(),
    firebaseUid: "admin-firebase-uid-1",
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    isActive: true,
  };

  const staffUser = {
    _id: new ObjectId(),
    firebaseUid: "staff-firebase-uid-2",
    name: "Staff User",
    email: "staff@example.com",
    role: "STAFF",
    isActive: true,
  };

  let mockCollection;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      }),
      deleteOne: jest.fn(),
    };

    setDb({
      collection: jest.fn().mockReturnValue(mockCollection),
    });

    jest.clearAllMocks();
  });

  describe("POST /api/auth/admin/register", () => {
    it("should register Admin successfully when valid token and name are provided", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne.mockResolvedValue(null);
      const insertedId = new ObjectId();
      mockCollection.insertOne.mockResolvedValueOnce({ insertedId });

      const res = await request(app)
        .post("/api/auth/admin/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Admin User" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        message: "Admin registered successfully",
        data: {
          user: expect.objectContaining({
            id: insertedId.toString(),
            firebaseUid: adminDecoded.uid,
            name: "Admin User",
            email: adminDecoded.email,
            role: "ADMIN",
            isActive: true,
          }),
        },
      });
    });

    it("should reject client-provided role in body (400)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);

      const res = await request(app)
        .post("/api/auth/admin/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Admin User", role: "STAFF" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 if unauthenticated", async () => {
      const res = await request(app)
        .post("/api/auth/admin/register")
        .send({ name: "Admin User" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/sync", () => {
    it("should sync user session when authenticated", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne.mockResolvedValueOnce(adminUser);
      mockCollection.findOneAndUpdate.mockResolvedValueOnce({
        ...adminUser,
        lastLoginAt: new Date(),
      });

      const res = await request(app)
        .post("/api/auth/sync")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.firebaseUid).toBe(adminDecoded.uid);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 401 if token is missing", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("should return 200 with user profile for authenticated ADMIN", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne
        .mockResolvedValueOnce(adminUser) // authorize middleware
        .mockResolvedValueOnce(adminUser); // getCurrentUser

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe("ADMIN");
      expect(res.body.data.user.email).toBe(adminDecoded.email);
    });

    it("should return 200 with user profile for authenticated STAFF", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(staffDecoded);
      mockCollection.findOne
        .mockResolvedValueOnce(staffUser) // authorize middleware
        .mockResolvedValueOnce(staffUser); // getCurrentUser

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe("STAFF");
    });

    it("should return 403 if account is deactivated", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(staffDecoded);
      mockCollection.findOne.mockResolvedValueOnce({
        ...staffUser,
        isActive: false,
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/inactive or deactivated/i);
    });
  });

  describe("POST /api/auth/staff (RBAC)", () => {
    const newStaffPayload = {
      name: "New Staff",
      email: "new.staff@example.com",
      password: "Password123!",
    };

    it("should allow ADMIN to create new Staff member (201)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne
        .mockResolvedValueOnce(adminUser) // authorize middleware
        .mockResolvedValueOnce(null); // findUserByEmail in createStaff

      const notFoundErr = new Error("User not found");
      notFoundErr.code = "auth/user-not-found";
      jest.spyOn(adminAuth, "getUserByEmail").mockRejectedValueOnce(notFoundErr);

      jest.spyOn(adminAuth, "createUser").mockResolvedValueOnce({
        uid: "new-staff-created-uid",
      });

      const insertedStaffId = new ObjectId();
      mockCollection.insertOne.mockResolvedValueOnce({ insertedId: insertedStaffId });

      const res = await request(app)
        .post("/api/auth/staff")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newStaffPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.staff.role).toBe("STAFF");
      expect(res.body.data.staff.firebaseUid).toBe("new-staff-created-uid");
    });

    it("should deny STAFF from creating new Staff member (403 Forbidden)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(staffDecoded);
      mockCollection.findOne.mockResolvedValueOnce(staffUser); // authorize middleware check

      const res = await request(app)
        .post("/api/auth/staff")
        .set("Authorization", `Bearer ${staffToken}`)
        .send(newStaffPayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient permissions/i);
    });
  });

  describe("GET /api/auth/staff (RBAC)", () => {
    it("should allow ADMIN to list all staff members (200)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne.mockResolvedValueOnce(adminUser); // authorize
      mockCollection.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValueOnce([staffUser]),
        }),
      });

      const res = await request(app)
        .get("/api/auth/staff")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.staff).toHaveLength(1);
    });

    it("should deny STAFF from listing staff members (403)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(staffDecoded);
      mockCollection.findOne.mockResolvedValueOnce(staffUser);

      const res = await request(app)
        .get("/api/auth/staff")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/auth/staff/:firebaseUid", () => {
    it("should allow ADMIN to fetch specific staff member (200)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne
        .mockResolvedValueOnce(adminUser) // authorize
        .mockResolvedValueOnce(staffUser); // getStaff

      const res = await request(app)
        .get("/api/auth/staff/staff-firebase-uid-2")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.staff.firebaseUid).toBe("staff-firebase-uid-2");
    });
  });

  describe("PATCH /api/auth/staff/:firebaseUid/status (RBAC)", () => {
    it("should allow ADMIN to update staff status (200)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne
        .mockResolvedValueOnce(adminUser) // authorize
        .mockResolvedValueOnce(staffUser); // updateStaffStatus lookup

      jest.spyOn(adminAuth, "updateUser").mockResolvedValueOnce();
      jest.spyOn(adminAuth, "revokeRefreshTokens").mockResolvedValueOnce();

      mockCollection.findOneAndUpdate.mockResolvedValueOnce({
        ...staffUser,
        isActive: false,
      });

      const res = await request(app)
        .patch("/api/auth/staff/staff-firebase-uid-2/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.staff.isActive).toBe(false);
    });

    it("should reject invalid status body with 400", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne.mockResolvedValueOnce(adminUser);

      const res = await request(app)
        .patch("/api/auth/staff/staff-firebase-uid-2/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: "invalid-boolean" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should deny STAFF from updating status (403)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(staffDecoded);
      mockCollection.findOne.mockResolvedValueOnce(staffUser);

      const res = await request(app)
        .patch("/api/auth/staff/staff-firebase-uid-2/status")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/auth/staff/:firebaseUid/revoke (RBAC)", () => {
    it("should allow ADMIN to revoke staff sessions (200)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(adminDecoded);
      mockCollection.findOne
        .mockResolvedValueOnce(adminUser) // authorize
        .mockResolvedValueOnce(staffUser); // revokeStaffSessions lookup

      jest.spyOn(adminAuth, "revokeRefreshTokens").mockResolvedValueOnce();

      const res = await request(app)
        .post("/api/auth/staff/staff-firebase-uid-2/revoke")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should deny STAFF from revoking sessions (403)", async () => {
      jest.spyOn(adminAuth, "verifyIdToken").mockResolvedValueOnce(staffDecoded);
      mockCollection.findOne.mockResolvedValueOnce(staffUser);

      const res = await request(app)
        .post("/api/auth/staff/staff-firebase-uid-2/revoke")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });
  });
});

