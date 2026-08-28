import { jest } from "@jest/globals";
import { authorize } from "../../src/middleware/authorize.js";
import { setDb } from "../../src/config/database.js";

describe("Authorize Middleware Unit Tests", () => {
  let req;
  let res;
  let next;
  let mockCollection;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
    };
    setDb({
      collection: jest.fn().mockReturnValue(mockCollection),
    });

    req = {
      auth: {
        firebaseUid: "user-uid-123",
        email: "user@example.com",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should return 401 if req.auth is missing or has no firebaseUid", async () => {
    req.auth = null;
    const middleware = authorize("ADMIN");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Unauthorized: User identity not verified/i),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if application user profile is not found in MongoDB", async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const middleware = authorize("ADMIN");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden: Application profile not registered in the system.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if user account is deactivated (isActive: false)", async () => {
    const inactiveUser = {
      firebaseUid: "user-uid-123",
      name: "Inactive Staff",
      role: "STAFF",
      isActive: false,
    };
    mockCollection.findOne.mockResolvedValueOnce(inactiveUser);
    const middleware = authorize("STAFF");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden: Account is inactive or deactivated. Please contact an administrator.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if user has insufficient permissions (e.g. STAFF accessing ADMIN-only)", async () => {
    const staffUser = {
      firebaseUid: "user-uid-123",
      name: "Staff User",
      role: "STAFF",
      isActive: true,
    };
    mockCollection.findOne.mockResolvedValueOnce(staffUser);
    const middleware = authorize("ADMIN");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden: Insufficient permissions. Required role: ADMIN.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow ADMIN to access ADMIN-protected route", async () => {
    const adminUser = {
      firebaseUid: "user-uid-123",
      name: "Admin User",
      role: "ADMIN",
      isActive: true,
    };
    mockCollection.findOne.mockResolvedValueOnce(adminUser);
    const middleware = authorize("ADMIN");

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(adminUser);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow STAFF to access STAFF-protected route", async () => {
    const staffUser = {
      firebaseUid: "user-uid-123",
      name: "Staff User",
      role: "STAFF",
      isActive: true,
    };
    mockCollection.findOne.mockResolvedValueOnce(staffUser);
    const middleware = authorize("STAFF");

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(staffUser);
  });

  it("should allow both ADMIN and STAFF on shared routes", async () => {
    const staffUser = {
      firebaseUid: "user-uid-123",
      name: "Staff User",
      role: "STAFF",
      isActive: true,
    };
    mockCollection.findOne.mockResolvedValueOnce(staffUser);
    const middleware = authorize("ADMIN", "STAFF");

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(staffUser);
  });
});

