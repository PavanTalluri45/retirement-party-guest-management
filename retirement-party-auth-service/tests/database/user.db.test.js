import { jest } from "@jest/globals";
import { ObjectId } from "mongodb";
import { setDb } from "../../src/config/database.js";
import * as userDb from "../../src/database/user.db.js";

describe("User Database Layer Unit Tests", () => {
  let mockCollection;

  beforeEach(() => {
    mockCollection = {
      createIndex: jest.fn().mockResolvedValue("index_name"),
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      }),
      insertOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    };

    setDb({
      collection: jest.fn().mockReturnValue(mockCollection),
    });
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ensureIndexes should create unique indexes on firebaseUid and email", async () => {
    await userDb.ensureIndexes();

    expect(mockCollection.createIndex).toHaveBeenCalledWith(
      { firebaseUid: 1 },
      { unique: true, name: "idx_users_firebaseUid_unique" }
    );
    expect(mockCollection.createIndex).toHaveBeenCalledWith(
      { email: 1 },
      { unique: true, name: "idx_users_email_unique" }
    );
  });

  it("findUserByFirebaseUid should query with exact firebaseUid", async () => {
    const mockUser = { firebaseUid: "uid-123", name: "User" };
    mockCollection.findOne.mockResolvedValueOnce(mockUser);

    const result = await userDb.findUserByFirebaseUid("uid-123");

    expect(mockCollection.findOne).toHaveBeenCalledWith({ firebaseUid: "uid-123" });
    expect(result).toEqual(mockUser);
  });

  it("findUserByFirebaseUid should return null if uid is falsy", async () => {
    const result = await userDb.findUserByFirebaseUid(null);
    expect(result).toBeNull();
    expect(mockCollection.findOne).not.toHaveBeenCalled();
  });

  it("findUserByEmail should query with case-insensitive regex", async () => {
    const mockUser = { email: "user@example.com", name: "User" };
    mockCollection.findOne.mockResolvedValueOnce(mockUser);

    const result = await userDb.findUserByEmail(" USER@EXAMPLE.COM ");

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      email: { $regex: /^user@example.com$/i },
    });
    expect(result).toEqual(mockUser);
  });

  it("findUserById should parse string id to ObjectId", async () => {
    const validObjectIdStr = new ObjectId().toString();
    const mockUser = { _id: new ObjectId(validObjectIdStr), name: "User" };
    mockCollection.findOne.mockResolvedValueOnce(mockUser);

    const result = await userDb.findUserById(validObjectIdStr);

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
    });
    expect(result).toEqual(mockUser);
  });

  it("findUserById should return null on invalid id format", async () => {
    const result = await userDb.findUserById("invalid-id-format");
    expect(result).toBeNull();
  });

  it("createUser should insert document with timestamps and defaults", async () => {
    const insertedId = new ObjectId();
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId });

    const result = await userDb.createUser({
      firebaseUid: "new-uid",
      name: " Alice ",
      email: " ALICE@EXAMPLE.COM ",
      role: "ADMIN",
    });

    expect(mockCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        firebaseUid: "new-uid",
        name: "Alice",
        email: "alice@example.com",
        role: "ADMIN",
        isActive: true,
        lastLoginAt: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
    expect(result._id).toEqual(insertedId);
  });

  it("updateUserByFirebaseUid should update document with updatedAt", async () => {
    const updatedDoc = { firebaseUid: "uid-1", name: "Updated" };
    mockCollection.findOneAndUpdate.mockResolvedValueOnce(updatedDoc);

    const result = await userDb.updateUserByFirebaseUid("uid-1", { name: "Updated" });

    expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
      { firebaseUid: "uid-1" },
      { $set: expect.objectContaining({ name: "Updated", updatedAt: expect.any(Date) }) },
      { returnDocument: "after" }
    );
    expect(result).toEqual(updatedDoc);
  });

  it("listStaff should find with role STAFF and sort by createdAt desc", async () => {
    const staffList = [{ firebaseUid: "s1", role: "STAFF" }];
    const toArrayMock = jest.fn().mockResolvedValueOnce(staffList);
    const sortMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
    mockCollection.find.mockReturnValueOnce({ sort: sortMock });

    const result = await userDb.listStaff();

    expect(mockCollection.find).toHaveBeenCalledWith({ role: "STAFF" });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual(staffList);
  });

  it("findStaffByFirebaseUid should query with firebaseUid and role STAFF", async () => {
    const staffDoc = { firebaseUid: "staff-1", role: "STAFF" };
    mockCollection.findOne.mockResolvedValueOnce(staffDoc);

    const result = await userDb.findStaffByFirebaseUid("staff-1");

    expect(mockCollection.findOne).toHaveBeenCalledWith({
      firebaseUid: "staff-1",
      role: "STAFF",
    });
    expect(result).toEqual(staffDoc);
  });

  it("deleteUserByFirebaseUid should delete document by firebaseUid", async () => {
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });

    const result = await userDb.deleteUserByFirebaseUid("uid-to-delete");

    expect(mockCollection.deleteOne).toHaveBeenCalledWith({ firebaseUid: "uid-to-delete" });
    expect(result).toEqual({ deletedCount: 1 });
  });
});

