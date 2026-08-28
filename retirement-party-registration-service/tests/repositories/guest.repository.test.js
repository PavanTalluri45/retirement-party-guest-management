import { jest } from "@jest/globals";
import { ObjectId } from "mongodb";

// Mock database config
jest.unstable_mockModule("../../src/config/database.js", () => ({
  getDb: jest.fn(),
  connectDB: jest.fn(),
  closeDB: jest.fn(),
  setDb: jest.fn(),
}));

const { getDb } = await import("../../src/config/database.js");
const {
  ensureIndexes,
  insertGuest,
  findByPhone,
  findByConfirmationNumber,
  findById,
  existsByConfirmationNumber,
} = await import("../../src/repositories/guest.repository.js");

describe("guest.repository", () => {
  let mockCollection;
  let mockDb;

  beforeEach(() => {
    mockCollection = {
      createIndex: jest.fn().mockResolvedValue("idx_created"),
      insertOne: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
    };
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };
    getDb.mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("ensureIndexes", () => {
    it("creates phone unique index, confirmation unique index, and attending index", async () => {
      await ensureIndexes();
      expect(mockDb.collection).toHaveBeenCalledWith("guests");
      expect(mockCollection.createIndex).toHaveBeenCalledTimes(3);
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { phone: 1 },
        { unique: true, name: "idx_guests_phone_unique" }
      );
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { confirmationNumber: 1 },
        { unique: true, sparse: true, name: "idx_guests_confirmationNumber_unique" }
      );
    });
  });

  describe("insertGuest", () => {
    it("inserts a guest with registeredAt date and returns document with _id", async () => {
      const fakeId = new ObjectId();
      mockCollection.insertOne.mockResolvedValue({ insertedId: fakeId });

      const guestData = {
        name: "Test Guest",
        phone: "9876543210",
        attending: true,
      };

      const result = await insertGuest(guestData);

      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(result._id).toBe(fakeId);
      expect(result.name).toBe("Test Guest");
      expect(result.registeredAt).toBeInstanceOf(Date);
    });
  });

  describe("findByPhone", () => {
    it("queries guests collection with phone filter", async () => {
      mockCollection.findOne.mockResolvedValue({ name: "Found Guest", phone: "9876543210" });

      const result = await findByPhone("9876543210");
      expect(mockCollection.findOne).toHaveBeenCalledWith({ phone: "9876543210" });
      expect(result.name).toBe("Found Guest");
    });
  });

  describe("findByConfirmationNumber", () => {
    it("queries guests collection with confirmationNumber filter", async () => {
      mockCollection.findOne.mockResolvedValue({ name: "Found Guest", confirmationNumber: "0142" });

      const result = await findByConfirmationNumber("0142");
      expect(mockCollection.findOne).toHaveBeenCalledWith({ confirmationNumber: "0142" });
      expect(result.confirmationNumber).toBe("0142");
    });
  });

  describe("findById", () => {
    it("queries guests collection with ObjectId", async () => {
      const fakeId = new ObjectId();
      mockCollection.findOne.mockResolvedValue({ _id: fakeId, name: "Found Guest" });

      const result = await findById(fakeId.toString());
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: fakeId });
      expect(result.name).toBe("Found Guest");
    });
  });

  describe("existsByConfirmationNumber", () => {
    it("returns true when countDocuments > 0", async () => {
      mockCollection.countDocuments.mockResolvedValue(1);

      const exists = await existsByConfirmationNumber("0142");
      expect(mockCollection.countDocuments).toHaveBeenCalledWith(
        { confirmationNumber: "0142" },
        { limit: 1 }
      );
      expect(exists).toBe(true);
    });

    it("returns false when countDocuments === 0", async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const exists = await existsByConfirmationNumber("9999");
      expect(exists).toBe(false);
    });
  });
});

