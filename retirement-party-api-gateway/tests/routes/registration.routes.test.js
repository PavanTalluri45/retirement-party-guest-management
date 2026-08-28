import { jest } from "@jest/globals";
import request from "supertest";

// Mock registrationClient
jest.unstable_mockModule(
  "../../src/services/registration-client.js",
  () => ({
    registrationClient: {
      checkHealth: jest.fn(),
      register: jest.fn(),
      getByConfirmationNumber: jest.fn(),
      getById: jest.fn(),
    },
  })
);

// Mock authClient to keep app.js imports happy
jest.unstable_mockModule("../../src/services/auth-client.js", () => ({
  authClient: {
    checkHealth: jest.fn(),
    getMe: jest.fn(),
    sync: jest.fn(),
    adminRegister: jest.fn(),
    createStaff: jest.fn(),
    listStaff: jest.fn(),
    getStaff: jest.fn(),
    updateStaffStatus: jest.fn(),
    revokeStaff: jest.fn(),
  },
}));

const app = (await import("../../src/app.js")).default;
const { registrationClient } = await import(
  "../../src/services/registration-client.js"
);

describe("API Gateway Registration Routes Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /registrations (Public)", () => {
    it("proxies registration request and returns 201 with confirmation number", async () => {
      const responseData = {
        success: true,
        data: {
          id: "507f1f77bcf86cd799439011",
          name: "Ravi Kumar",
          phone: "9876543210",
          attending: true,
          confirmationNumber: "0142",
        },
      };

      registrationClient.register.mockResolvedValue({
        status: 201,
        data: responseData,
      });

      const res = await request(app).post("/registrations").send({
        name: "Ravi Kumar",
        phone: "9876543210",
        attending: true,
        familyCount: 1,
        mealPreference: "VEG",
        familyMembers: [],
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.confirmationNumber).toBe("0142");
    });

    it("works with /api/registrations alias", async () => {
      registrationClient.register.mockResolvedValue({
        status: 201,
        data: { success: true },
      });

      const res = await request(app).post("/api/registrations").send({
        name: "Ravi Kumar",
        phone: "9876543210",
        attending: false,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("forwards 409 duplicate phone error from downstream", async () => {
      registrationClient.register.mockResolvedValue({
        status: 409,
        data: {
          success: false,
          message: "This phone number has already been registered.",
        },
      });

      const res = await request(app).post("/registrations").send({
        name: "Ravi Kumar",
        phone: "9876543210",
        attending: true,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already been registered");
    });

    it("returns 502 when registration service is unreachable", async () => {
      const { ProxyError } = await import("../../src/utils/proxy-request.js");
      registrationClient.register.mockRejectedValue(
        new ProxyError("Downstream failed", new Error("ECONNREFUSED"))
      );

      const res = await request(app).post("/registrations").send({
        name: "Ravi Kumar",
        phone: "9876543210",
        attending: true,
      });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("unavailable");
    });
  });

  describe("GET /registrations/confirmation/:confirmationNumber (Public)", () => {
    it("proxies lookup by confirmation number and returns 200", async () => {
      registrationClient.getByConfirmationNumber.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: { confirmationNumber: "0142", name: "Ravi Kumar" },
        },
      });

      const res = await request(app).get("/registrations/confirmation/0142");
      expect(res.status).toBe(200);
      expect(res.body.data.confirmationNumber).toBe("0142");
    });

    it("forwards 404 when confirmation number not found", async () => {
      registrationClient.getByConfirmationNumber.mockResolvedValue({
        status: 404,
        data: { success: false, message: "Not found" },
      });

      const res = await request(app).get("/registrations/confirmation/9999");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /registrations/id/:id (Public)", () => {
    it("proxies lookup by MongoDB ID and returns 200", async () => {
      registrationClient.getById.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: { id: "507f1f77bcf86cd799439011", name: "Ravi Kumar" },
        },
      });

      const res = await request(app).get(
        "/registrations/id/507f1f77bcf86cd799439011"
      );
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("507f1f77bcf86cd799439011");
    });
  });
});

