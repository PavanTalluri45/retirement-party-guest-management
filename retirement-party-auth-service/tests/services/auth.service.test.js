import { jest } from "@jest/globals";
import { ObjectId } from "mongodb";
import { adminAuth } from "../../src/config/firebase.js";
import { setDb } from "../../src/config/database.js";
import {
  registerAdmin,
  syncUser,
  getCurrentUser,
  createStaff,
  listStaff,
  getStaff,
  updateStaffStatus,
  revokeStaffSessions,
} from "../../src/services/auth.service.js";

describe("Auth Service Unit Tests", () => {
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
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("registerAdmin()", () => {
    it("should register a new Admin profile in MongoDB", async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const insertedId = new ObjectId();
      mockCollection.insertOne.mockResolvedValueOnce({ insertedId });

      const result = await registerAdmin("admin-firebase-uid", "admin@example.com", {
        name: "Admin User",
      });

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          firebaseUid: "admin-firebase-uid",
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
          isActive: true,
          lastLoginAt: null,
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: insertedId.toString(),
          firebaseUid: "admin-firebase-uid",
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
          isActive: true,
        })
      );
    });

    it("should throw 409 if Firebase UID is already registered", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        _id: new ObjectId(),
        firebaseUid: "admin-firebase-uid",
      });

      await expect(
        registerAdmin("admin-firebase-uid", "admin@example.com", { name: "Admin" })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "An application profile is already registered for this account.",
      });
    });

    it("should throw 409 if email is already in use", async () => {
      mockCollection.findOne
        .mockResolvedValueOnce(null) // findUserByFirebaseUid
        .mockResolvedValueOnce({ _id: new ObjectId(), email: "admin@example.com" }); // findUserByEmail

      await expect(
        registerAdmin("admin-firebase-uid", "admin@example.com", { name: "Admin" })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "A user profile with this email address already exists.",
      });
    });

    it("should rollback and delete Firebase user if MongoDB profile creation fails", async () => {
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockRejectedValueOnce(new Error("MongoDB connection lost"));
      const spyDeleteUser = jest.spyOn(adminAuth, "deleteUser").mockResolvedValueOnce();

      await expect(
        registerAdmin("admin-firebase-uid", "admin@example.com", { name: "Admin" })
      ).rejects.toThrow("MongoDB connection lost");

      expect(spyDeleteUser).toHaveBeenCalledWith("admin-firebase-uid");
    });
  });

  describe("syncUser()", () => {
    it("should update lastLoginAt for active user", async () => {
      const existingUser = {
        _id: new ObjectId(),
        firebaseUid: "uid-100",
        name: "Test User",
        email: "user@example.com",
        role: "ADMIN",
        isActive: true,
      };
      mockCollection.findOne.mockResolvedValueOnce(existingUser);
      mockCollection.findOneAndUpdate.mockResolvedValueOnce({
        ...existingUser,
        lastLoginAt: new Date(),
      });

      const result = await syncUser("uid-100", "user@example.com");

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { firebaseUid: "uid-100" },
        { $set: expect.objectContaining({ lastLoginAt: expect.any(Date) }) },
        { returnDocument: "after" }
      );
      expect(result.firebaseUid).toBe("uid-100");
    });

    it("should throw 404 if user does not exist in MongoDB", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      await expect(syncUser("unknown-uid", "unknown@example.com")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 403 if user is inactive", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        firebaseUid: "inactive-uid",
        isActive: false,
      });

      await expect(syncUser("inactive-uid", "inactive@example.com")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("getCurrentUser()", () => {
    it("should return formatted user profile", async () => {
      const mongoId = new ObjectId();
      mockCollection.findOne.mockResolvedValueOnce({
        _id: mongoId,
        firebaseUid: "user-99",
        name: "Staff Person",
        email: "staff@example.com",
        role: "STAFF",
        isActive: true,
      });

      const user = await getCurrentUser("user-99");
      expect(user.id).toBe(mongoId.toString());
      expect(user.role).toBe("STAFF");
      expect(user.isActive).toBe(true);
    });

    it("should throw 404 if user not found", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      await expect(getCurrentUser("ghost-uid")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 403 if user is inactive", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        firebaseUid: "deactivated-uid",
        isActive: false,
      });

      await expect(getCurrentUser("deactivated-uid")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("createStaff()", () => {
    it("should create Firebase user and MongoDB STAFF profile", async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const notFoundErr = new Error("User not found");
      notFoundErr.code = "auth/user-not-found";
      jest.spyOn(adminAuth, "getUserByEmail").mockRejectedValueOnce(notFoundErr);

      jest.spyOn(adminAuth, "createUser").mockResolvedValueOnce({
        uid: "new-staff-firebase-uid",
        email: "staff@example.com",
      });

      const staffMongoId = new ObjectId();
      mockCollection.insertOne.mockResolvedValueOnce({ insertedId: staffMongoId });

      const result = await createStaff({
        name: "John Staff",
        email: "staff@example.com",
        password: "Password123!",
      });

      expect(adminAuth.createUser).toHaveBeenCalledWith({
        email: "staff@example.com",
        password: "Password123!",
        displayName: "John Staff",
      });
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          firebaseUid: "new-staff-firebase-uid",
          name: "John Staff",
          email: "staff@example.com",
          role: "STAFF",
          isActive: true,
          lastLoginAt: null,
        })
      );
      expect(result.role).toBe("STAFF");
      expect(result.firebaseUid).toBe("new-staff-firebase-uid");
    });

    it("should throw 409 if email already exists in MongoDB", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        email: "staff@example.com",
      });

      await expect(
        createStaff({ name: "Staff", email: "staff@example.com", password: "Password123!" })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "A staff member with this email address already exists.",
      });
    });

    it("should throw 409 if email already exists in Firebase", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);
      jest.spyOn(adminAuth, "getUserByEmail").mockResolvedValueOnce({
        uid: "existing-fb-uid",
        email: "staff@example.com",
      });

      await expect(
        createStaff({ name: "Staff", email: "staff@example.com", password: "Password123!" })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "An authentication account with this email already exists in Firebase.",
      });
    });

    it("should rollback and delete Firebase Staff user if MongoDB insertion fails", async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const notFoundErr = new Error("User not found");
      notFoundErr.code = "auth/user-not-found";
      jest.spyOn(adminAuth, "getUserByEmail").mockRejectedValueOnce(notFoundErr);

      jest.spyOn(adminAuth, "createUser").mockResolvedValueOnce({
        uid: "rollback-staff-uid",
      });
      mockCollection.insertOne.mockRejectedValueOnce(new Error("Mongo insert failed"));
      const spyDelete = jest.spyOn(adminAuth, "deleteUser").mockResolvedValueOnce();

      await expect(
        createStaff({ name: "Staff", email: "staff@example.com", password: "Password123!" })
      ).rejects.toThrow("Mongo insert failed");

      expect(spyDelete).toHaveBeenCalledWith("rollback-staff-uid");
    });
  });

  describe("listStaff() and getStaff()", () => {
    it("should return formatted staff list", async () => {
      const staffArray = [
        { _id: new ObjectId(), firebaseUid: "u1", name: "S1", email: "s1@ex.com", role: "STAFF", isActive: true },
        { _id: new ObjectId(), firebaseUid: "u2", name: "S2", email: "s2@ex.com", role: "STAFF", isActive: false },
      ];
      mockCollection.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValueOnce(staffArray),
        }),
      });

      const staff = await listStaff();
      expect(staff).toHaveLength(2);
      expect(staff[0].name).toBe("S1");
      expect(staff[1].name).toBe("S2");
    });

    it("should return specific staff member by Firebase UID", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        _id: new ObjectId(),
        firebaseUid: "u1",
        name: "S1",
        email: "s1@ex.com",
        role: "STAFF",
        isActive: true,
      });

      const staff = await getStaff("u1");
      expect(staff.firebaseUid).toBe("u1");
    });

    it("should throw 404 if staff member is not found", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      await expect(getStaff("unknown-staff")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("updateStaffStatus()", () => {
    it("should update Firebase user disabled flag, revoke tokens on deactivation, and update MongoDB", async () => {
      const staffDoc = {
        _id: new ObjectId(),
        firebaseUid: "staff-uid-10",
        name: "Staff 10",
        email: "s10@ex.com",
        role: "STAFF",
        isActive: true,
      };
      mockCollection.findOne.mockResolvedValueOnce(staffDoc);
      const spyUpdateUser = jest.spyOn(adminAuth, "updateUser").mockResolvedValueOnce();
      const spyRevokeTokens = jest.spyOn(adminAuth, "revokeRefreshTokens").mockResolvedValueOnce();
      mockCollection.findOneAndUpdate.mockResolvedValueOnce({
        ...staffDoc,
        isActive: false,
      });

      const result = await updateStaffStatus("staff-uid-10", false);

      expect(spyUpdateUser).toHaveBeenCalledWith("staff-uid-10", { disabled: true });
      expect(spyRevokeTokens).toHaveBeenCalledWith("staff-uid-10");
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { firebaseUid: "staff-uid-10" },
        { $set: expect.objectContaining({ isActive: false }) },
        { returnDocument: "after" }
      );
      expect(result.isActive).toBe(false);
    });

    it("should enable Firebase user when activating without revoking tokens", async () => {
      const staffDoc = {
        _id: new ObjectId(),
        firebaseUid: "staff-uid-10",
        name: "Staff 10",
        email: "s10@ex.com",
        role: "STAFF",
        isActive: false,
      };
      mockCollection.findOne.mockResolvedValueOnce(staffDoc);
      const spyUpdateUser = jest.spyOn(adminAuth, "updateUser").mockResolvedValueOnce();
      const spyRevokeTokens = jest.spyOn(adminAuth, "revokeRefreshTokens");
      mockCollection.findOneAndUpdate.mockResolvedValueOnce({
        ...staffDoc,
        isActive: true,
      });

      const result = await updateStaffStatus("staff-uid-10", true);

      expect(spyUpdateUser).toHaveBeenCalledWith("staff-uid-10", { disabled: false });
      expect(spyRevokeTokens).not.toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });

    it("should throw 404 if staff not found during status update", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      await expect(updateStaffStatus("ghost-staff", true)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("revokeStaffSessions()", () => {
    it("should call adminAuth.revokeRefreshTokens with correct UID", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        firebaseUid: "staff-uid-20",
        name: "Staff Member",
      });
      const spyRevoke = jest.spyOn(adminAuth, "revokeRefreshTokens").mockResolvedValueOnce();

      const result = await revokeStaffSessions("staff-uid-20");

      expect(spyRevoke).toHaveBeenCalledWith("staff-uid-20");
      expect(result.message).toContain("Staff Member have been revoked");
    });

    it("should throw 404 if staff member does not exist", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      await expect(revokeStaffSessions("ghost-staff")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});

