import { jest } from "@jest/globals";

// We test the service by mocking the repository and confirmation number util
// so no real database connection is needed.

// Mock modules before importing the service
jest.unstable_mockModule(
  "../../src/repositories/guest.repository.js",
  () => ({
    findByPhone: jest.fn(),
    insertGuest: jest.fn(),
    findByConfirmationNumber: jest.fn(),
    findById: jest.fn(),
    existsByConfirmationNumber: jest.fn(),
    ensureIndexes: jest.fn(),
  })
);

jest.unstable_mockModule("../../src/utils/confirmation-number.js", () => ({
  generateUniqueConfirmationNumber: jest.fn(),
}));

// Dynamic imports after mocks are set up
const { registerGuest, getGuestByConfirmationNumber, getGuestById } = await import(
  "../../src/services/registration.service.js"
);
const guestRepository = await import("../../src/repositories/guest.repository.js");
const { generateUniqueConfirmationNumber } = await import(
  "../../src/utils/confirmation-number.js"
);

const makeObjectId = () => ({ toString: () => "507f1f77bcf86cd799439011" });

describe("registrationService.registerGuest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers an attending guest and returns confirmation number", async () => {
    guestRepository.findByPhone.mockResolvedValue(null);
    generateUniqueConfirmationNumber.mockResolvedValue("0142");
    guestRepository.insertGuest.mockResolvedValue({
      _id: makeObjectId(),
      name: "Ravi Kumar",
      phone: "9876543210",
      attending: true,
      familyCount: 1,
      mealPreference: "VEG",
      familyMembers: [],
      confirmationNumber: "0142",
      registeredAt: new Date(),
    });

    const result = await registerGuest({
      name: "Ravi Kumar",
      phone: "9876543210",
      attending: true,
      familyCount: 1,
      mealPreference: "VEG",
      familyMembers: [],
    });

    expect(result.confirmationNumber).toBe("0142");
    expect(result.attending).toBe(true);
    expect(result.id).toBe("507f1f77bcf86cd799439011");
    expect(guestRepository.insertGuest).toHaveBeenCalledTimes(1);
  });

  it("registers a non-attending guest with no confirmation number", async () => {
    guestRepository.findByPhone.mockResolvedValue(null);
    guestRepository.insertGuest.mockResolvedValue({
      _id: makeObjectId(),
      name: "Sita Devi",
      phone: "8765432109",
      attending: false,
      familyCount: 0,
      mealPreference: null,
      familyMembers: [],
      confirmationNumber: null,
      registeredAt: new Date(),
    });

    const result = await registerGuest({
      name: "Sita Devi",
      phone: "8765432109",
      attending: false,
    });

    expect(result.confirmationNumber).toBeUndefined();
    expect(result.attending).toBe(false);
    expect(generateUniqueConfirmationNumber).not.toHaveBeenCalled();
  });

  it("throws DUPLICATE_PHONE when phone already exists", async () => {
    guestRepository.findByPhone.mockResolvedValue({ phone: "9876543210" });

    await expect(
      registerGuest({
        name: "Ravi Kumar",
        phone: "9876543210",
        attending: false,
      })
    ).rejects.toMatchObject({
      type: "DUPLICATE_PHONE",
      message: expect.stringContaining("already been registered"),
    });

    expect(guestRepository.insertGuest).not.toHaveBeenCalled();
  });

  it("throws VALIDATION_ERROR for invalid phone format", async () => {
    await expect(
      registerGuest({
        name: "Test",
        phone: "12345",
        attending: false,
      })
    ).rejects.toMatchObject({ type: "VALIDATION_ERROR" });
  });

  it("throws VALIDATION_ERROR when attending but no mealPreference", async () => {
    await expect(
      registerGuest({
        name: "Test User",
        phone: "9999988888",
        attending: true,
        familyCount: 1,
        familyMembers: [],
        // mealPreference missing
      })
    ).rejects.toMatchObject({ type: "VALIDATION_ERROR" });
  });
});

describe("registrationService.getGuestByConfirmationNumber", () => {
  it("returns guest when found", async () => {
    guestRepository.findByConfirmationNumber.mockResolvedValue({
      _id: makeObjectId(),
      name: "Ravi Kumar",
      confirmationNumber: "0142",
      attending: true,
    });

    const result = await getGuestByConfirmationNumber("0142");
    expect(result.confirmationNumber).toBe("0142");
  });

  it("throws NOT_FOUND when guest does not exist", async () => {
    guestRepository.findByConfirmationNumber.mockResolvedValue(null);

    await expect(getGuestByConfirmationNumber("9999")).rejects.toMatchObject({
      type: "NOT_FOUND",
    });
  });
});

describe("registrationService.getGuestById", () => {
  it("returns guest when found", async () => {
    guestRepository.findById.mockResolvedValue({
      _id: makeObjectId(),
      name: "Ravi Kumar",
      attending: false,
      confirmationNumber: null,
    });

    const result = await getGuestById("507f1f77bcf86cd799439011");
    expect(result.id).toBe("507f1f77bcf86cd799439011");
    expect(result.confirmationNumber).toBeUndefined();
  });

  it("throws NOT_FOUND when guest does not exist", async () => {
    guestRepository.findById.mockResolvedValue(null);

    await expect(getGuestById("507f1f77bcf86cd799439011")).rejects.toMatchObject({
      type: "NOT_FOUND",
    });
  });
});

