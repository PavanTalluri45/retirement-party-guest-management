import { jest } from "@jest/globals";
import request from "supertest";

// Mock all service calls so no database is needed for route tests
jest.unstable_mockModule(
  "../../src/services/registration.service.js",
  () => ({
    registerGuest: jest.fn(),
    getGuestByConfirmationNumber: jest.fn(),
    getGuestById: jest.fn(),
  })
);

const app = (await import("../../src/app.js")).default;
const registrationService = await import("../../src/services/registration.service.js");

const VALID_ATTENDING_BODY = {
  name: "Ravi Kumar",
  phone: "9876543210",
  attending: true,
  familyCount: 1,
  mealPreference: "VEG",
  familyMembers: [],
};

const VALID_NOT_ATTENDING_BODY = {
  name: "Sita Devi",
  phone: "8765432109",
  attending: false,
};

const MOCK_ATTENDING_GUEST = {
  id: "507f1f77bcf86cd799439011",
  name: "Ravi Kumar",
  phone: "9876543210",
  attending: true,
  familyCount: 1,
  mealPreference: "VEG",
  familyMembers: [],
  confirmationNumber: "0142",
  registeredAt: new Date().toISOString(),
};

const MOCK_NOT_ATTENDING_GUEST = {
  id: "507f1f77bcf86cd799439012",
  name: "Sita Devi",
  phone: "8765432109",
  attending: false,
  familyCount: 0,
  mealPreference: null,
  familyMembers: [],
  registeredAt: new Date().toISOString(),
};

describe("GET /health", () => {
  it("returns 200 with healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("healthy");
    expect(res.body.service).toBe("retirement-party-registration-service");
  });
});

describe("POST /registrations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates an attending guest and returns 201 with confirmationNumber", async () => {
    registrationService.registerGuest.mockResolvedValue(MOCK_ATTENDING_GUEST);

    const res = await request(app).post("/registrations").send(VALID_ATTENDING_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.confirmationNumber).toBe("0142");
    expect(res.body.data.attending).toBe(true);
  });

  it("creates a non-attending guest and returns 201 without confirmationNumber", async () => {
    registrationService.registerGuest.mockResolvedValue(MOCK_NOT_ATTENDING_GUEST);

    const res = await request(app).post("/registrations").send(VALID_NOT_ATTENDING_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attending).toBe(false);
    expect(res.body.data.confirmationNumber).toBeUndefined();
  });

  it("returns 409 for duplicate phone number", async () => {
    const err = new Error("This phone number has already been registered.");
    err.type = "DUPLICATE_PHONE";
    registrationService.registerGuest.mockRejectedValue(err);

    const res = await request(app).post("/registrations").send(VALID_ATTENDING_BODY);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("already been registered");
  });

  it("returns 400 for validation errors", async () => {
    const err = new Error("Validation failed");
    err.type = "VALIDATION_ERROR";
    err.errors = [{ path: ["phone"], message: "Phone number must be exactly 10 digits." }];
    registrationService.registerGuest.mockRejectedValue(err);

    const res = await request(app).post("/registrations").send({ name: "Test", phone: "123", attending: false });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 500 on unexpected error", async () => {
    registrationService.registerGuest.mockRejectedValue(new Error("Database connection failed"));

    const res = await request(app).post("/registrations").send(VALID_ATTENDING_BODY);
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /registrations/confirmation/:confirmationNumber", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with guest for valid confirmation number", async () => {
    registrationService.getGuestByConfirmationNumber.mockResolvedValue(MOCK_ATTENDING_GUEST);

    const res = await request(app).get("/registrations/confirmation/0142");
    expect(res.status).toBe(200);
    expect(res.body.data.confirmationNumber).toBe("0142");
  });

  it("returns 400 for invalid confirmation number format", async () => {
    const res = await request(app).get("/registrations/confirmation/ABC");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 when guest not found", async () => {
    const err = new Error("No guest found with confirmation number: 9999");
    err.type = "NOT_FOUND";
    registrationService.getGuestByConfirmationNumber.mockRejectedValue(err);

    const res = await request(app).get("/registrations/confirmation/9999");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /registrations/id/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with guest for valid ObjectId", async () => {
    registrationService.getGuestById.mockResolvedValue(MOCK_ATTENDING_GUEST);

    const res = await request(app).get("/registrations/id/507f1f77bcf86cd799439011");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("507f1f77bcf86cd799439011");
  });

  it("returns 400 for invalid ObjectId format", async () => {
    const res = await request(app).get("/registrations/id/not-valid-id");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 when guest not found", async () => {
    const err = new Error("No guest found");
    err.type = "NOT_FOUND";
    registrationService.getGuestById.mockRejectedValue(err);

    const res = await request(app).get("/registrations/id/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });
});

describe("404 handling", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

