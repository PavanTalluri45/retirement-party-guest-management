import {
  adminRegisterSchema,
  createStaffSchema,
  updateStaffStatusSchema,
} from "../../src/validators/auth.validator.js";

describe("Auth Validators Unit Tests", () => {
  describe("adminRegisterSchema", () => {
    it("should accept valid admin name", () => {
      const valid = { name: "System Administrator" };
      const parsed = adminRegisterSchema.parse(valid);
      expect(parsed.name).toBe("System Administrator");
    });

    it("should trim leading and trailing whitespace from name", () => {
      const input = { name: "  Admin Name  " };
      const parsed = adminRegisterSchema.parse(input);
      expect(parsed.name).toBe("Admin Name");
    });

    it("should reject empty name", () => {
      expect(() => {
        adminRegisterSchema.parse({ name: "" });
      }).toThrow(/Name cannot be empty/i);
    });

    it("should reject missing name property", () => {
      expect(() => {
        adminRegisterSchema.parse({});
      }).toThrow();
    });

    it("should reject extra fields like role or firebaseUid (strict schema)", () => {
      expect(() => {
        adminRegisterSchema.parse({ name: "Admin", role: "ADMIN" });
      }).toThrow();

      expect(() => {
        adminRegisterSchema.parse({ name: "Admin", firebaseUid: "12345" });
      }).toThrow();
    });
  });

  describe("createStaffSchema", () => {
    it("should accept valid staff details", () => {
      const valid = {
        name: "Staff Member",
        email: "staff.member@example.com",
        password: "securePassword123!",
      };
      const parsed = createStaffSchema.parse(valid);
      expect(parsed.name).toBe("Staff Member");
      expect(parsed.email).toBe("staff.member@example.com");
      expect(parsed.password).toBe("securePassword123!");
    });

    it("should normalize email to lowercase", () => {
      const input = {
        name: "Staff Member",
        email: "STAFF@EXAMPLE.COM",
        password: "securePassword123!",
      };
      const parsed = createStaffSchema.parse(input);
      expect(parsed.email).toBe("staff@example.com");
    });

    it("should reject invalid email format", () => {
      expect(() => {
        createStaffSchema.parse({
          name: "Staff",
          email: "not-an-email",
          password: "password123",
        });
      }).toThrow(/Invalid email address format/i);
    });

    it("should reject password shorter than 8 characters", () => {
      expect(() => {
        createStaffSchema.parse({
          name: "Staff",
          email: "staff@example.com",
          password: "short",
        });
      }).toThrow(/Password must be at least 8 characters/i);
    });

    it("should reject missing required fields", () => {
      expect(() => {
        createStaffSchema.parse({ name: "Staff" });
      }).toThrow();
    });

    it("should reject client-provided role (strict schema)", () => {
      expect(() => {
        createStaffSchema.parse({
          name: "Staff",
          email: "staff@example.com",
          password: "password123",
          role: "ADMIN",
        });
      }).toThrow();
    });
  });

  describe("updateStaffStatusSchema", () => {
    it("should accept valid boolean isActive (true)", () => {
      const parsedActive = updateStaffStatusSchema.parse({ isActive: true });
      expect(parsedActive.isActive).toBe(true);
    });

    it("should accept valid boolean isActive (false)", () => {
      const parsedInactive = updateStaffStatusSchema.parse({ isActive: false });
      expect(parsedInactive.isActive).toBe(false);
    });

    it("should reject non-boolean isActive", () => {
      expect(() => {
        updateStaffStatusSchema.parse({ isActive: "true" });
      }).toThrow();

      expect(() => {
        updateStaffStatusSchema.parse({ isActive: 1 });
      }).toThrow();
    });

    it("should reject missing isActive", () => {
      expect(() => {
        updateStaffStatusSchema.parse({});
      }).toThrow();
    });
  });
});

