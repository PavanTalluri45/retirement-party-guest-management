import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  adminRegisterSchema,
  createStaffSchema,
  updateStaffStatusSchema,
} from "../src/validators/auth.validator.js";

describe("Auth Validators", () => {
  describe("adminRegisterSchema", () => {
    it("should accept valid admin name", () => {
      const valid = { name: "System Administrator" };
      const parsed = adminRegisterSchema.parse(valid);
      assert.equal(parsed.name, "System Administrator");
    });

    it("should trim whitespace from name", () => {
      const input = { name: "  Admin Name  " };
      const parsed = adminRegisterSchema.parse(input);
      assert.equal(parsed.name, "Admin Name");
    });

    it("should reject empty name", () => {
      assert.throws(() => {
        adminRegisterSchema.parse({ name: "" });
      }, /Name cannot be empty/);
    });

    it("should reject missing name", () => {
      assert.throws(() => {
        adminRegisterSchema.parse({});
      }, /string|name|required/i);
    });

    it("should reject extra fields like role or firebaseUid", () => {
      assert.throws(() => {
        adminRegisterSchema.parse({ name: "Admin", role: "ADMIN" });
      }, /Unrecognized/i);

      assert.throws(() => {
        adminRegisterSchema.parse({ name: "Admin", firebaseUid: "12345" });
      }, /Unrecognized/i);
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
      assert.equal(parsed.name, "Staff Member");
      assert.equal(parsed.email, "staff.member@example.com");
      assert.equal(parsed.password, "securePassword123!");
    });

    it("should normalize email to lowercase", () => {
      const input = {
        name: "Staff Member",
        email: "STAFF@EXAMPLE.COM",
        password: "securePassword123!",
      };
      const parsed = createStaffSchema.parse(input);
      assert.equal(parsed.email, "staff@example.com");
    });

    it("should reject invalid email format", () => {
      assert.throws(() => {
        createStaffSchema.parse({
          name: "Staff",
          email: "not-an-email",
          password: "password123",
        });
      }, /email/i);
    });

    it("should reject password shorter than 8 characters", () => {
      assert.throws(() => {
        createStaffSchema.parse({
          name: "Staff",
          email: "staff@example.com",
          password: "short",
        });
      }, /at least 8 characters/i);
    });

    it("should reject client-provided role", () => {
      assert.throws(() => {
        createStaffSchema.parse({
          name: "Staff",
          email: "staff@example.com",
          password: "password123",
          role: "ADMIN",
        });
      }, /Unrecognized/i);
    });
  });

  describe("updateStaffStatusSchema", () => {
    it("should accept valid boolean isActive", () => {
      const parsedActive = updateStaffStatusSchema.parse({ isActive: true });
      assert.equal(parsedActive.isActive, true);

      const parsedInactive = updateStaffStatusSchema.parse({ isActive: false });
      assert.equal(parsedInactive.isActive, false);
    });

    it("should reject non-boolean isActive", () => {
      assert.throws(() => {
        updateStaffStatusSchema.parse({ isActive: "true" });
      }, /boolean/i);

      assert.throws(() => {
        updateStaffStatusSchema.parse({ isActive: 1 });
      }, /boolean/i);
    });

    it("should reject missing isActive", () => {
      assert.throws(() => {
        updateStaffStatusSchema.parse({});
      }, /boolean/i);
    });
  });
});
