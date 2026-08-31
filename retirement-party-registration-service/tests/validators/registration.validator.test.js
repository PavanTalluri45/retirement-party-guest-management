import { RegistrationSchema, ConfirmationNumberParamSchema, IdParamSchema } from "../../src/validators/registration.validator.js";

describe("RegistrationSchema", () => {
  // --- Attending guests ---
  describe("attending guest", () => {
    const validAttending = {
      name: "Ravi Kumar",
      phone: "9876543210",
      attending: true,
      familyCount: 2,
      mealPreference: "VEG",
      familyMembers: [{ name: "Priya Kumar", mealPreference: "NON_VEG" }],
    };

    it("accepts a valid attending registration", () => {
      const result = RegistrationSchema.safeParse(validAttending);
      expect(result.success).toBe(true);
    });

    it("accepts familyCount=1 with no familyMembers", () => {
      const result = RegistrationSchema.safeParse({
        ...validAttending,
        familyCount: 1,
        familyMembers: [],
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing mealPreference for attending", () => {
      const { mealPreference, ...body } = validAttending;
      const result = RegistrationSchema.safeParse(body);
      expect(result.success).toBe(false);
      const messages = (result.error.issues || result.error.errors || []).map((e) => e.message);
      expect(messages.some((m) => m.includes("Meal preference"))).toBe(true);
    });

    it("rejects wrong familyMembers length", () => {
      const result = RegistrationSchema.safeParse({
        ...validAttending,
        familyCount: 3,
        familyMembers: [{ name: "Guest A", mealPreference: "VEG" }], // should be 2
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid meal preference", () => {
      const result = RegistrationSchema.safeParse({
        ...validAttending,
        mealPreference: "PIZZA",
      });
      expect(result.success).toBe(false);
    });

    it("rejects familyCount=5", () => {
      const result = RegistrationSchema.safeParse({
        ...validAttending,
        familyCount: 5,
        familyMembers: [
          { name: "A", mealPreference: "VEG" },
          { name: "B", mealPreference: "VEG" },
          { name: "C", mealPreference: "VEG" },
          { name: "D", mealPreference: "VEG" },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  // --- Non-attending guests ---
  describe("non-attending guest", () => {
    const validNotAttending = {
      name: "Sita Devi",
      phone: "8765432109",
      attending: false,
    };

    it("accepts a valid non-attending registration", () => {
      const result = RegistrationSchema.safeParse(validNotAttending);
      expect(result.success).toBe(true);
    });

    it("accepts non-attending without mealPreference or familyMembers", () => {
      const result = RegistrationSchema.safeParse(validNotAttending);
      expect(result.success).toBe(true);
    });

    it("normalizes formatted phone numbers before validation", () => {
      const result = RegistrationSchema.safeParse({
        name: "Sita Devi",
        phone: "(987) 654-3210",
        attending: false,
      });

      expect(result.success).toBe(true);
      expect(result.data.phone).toBe("9876543210");
    });
  });

  // --- Phone validation ---
  describe("phone validation", () => {
    it("rejects phone with fewer than 10 digits", () => {
      const result = RegistrationSchema.safeParse({
        name: "Test",
        phone: "12345",
        attending: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects phone with letters", () => {
      const result = RegistrationSchema.safeParse({
        name: "Test",
        phone: "98765abcde",
        attending: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing phone", () => {
      const result = RegistrationSchema.safeParse({ name: "Test", attending: false });
      expect(result.success).toBe(false);
    });
  });

  // --- Name validation ---
  describe("name validation", () => {
    it("rejects empty name", () => {
      const result = RegistrationSchema.safeParse({
        name: "",
        phone: "9876543210",
        attending: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing name", () => {
      const result = RegistrationSchema.safeParse({ phone: "9876543210", attending: false });
      expect(result.success).toBe(false);
    });
  });
});

describe("ConfirmationNumberParamSchema", () => {
  it("accepts 4-digit string", () => {
    expect(ConfirmationNumberParamSchema.safeParse({ confirmationNumber: "0142" }).success).toBe(true);
  });

  it("accepts leading-zero codes", () => {
    expect(ConfirmationNumberParamSchema.safeParse({ confirmationNumber: "0007" }).success).toBe(true);
  });

  it("rejects 3 digits", () => {
    expect(ConfirmationNumberParamSchema.safeParse({ confirmationNumber: "142" }).success).toBe(false);
  });

  it("rejects 5 digits", () => {
    expect(ConfirmationNumberParamSchema.safeParse({ confirmationNumber: "01420" }).success).toBe(false);
  });

  it("rejects letters", () => {
    expect(ConfirmationNumberParamSchema.safeParse({ confirmationNumber: "AB12" }).success).toBe(false);
  });
});

describe("IdParamSchema", () => {
  it("accepts a valid 24-char hex ObjectId", () => {
    expect(IdParamSchema.safeParse({ id: "507f1f77bcf86cd799439011" }).success).toBe(true);
  });

  it("rejects a short id", () => {
    expect(IdParamSchema.safeParse({ id: "abc123" }).success).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(IdParamSchema.safeParse({ id: "507f1f77bcf86cd79943901z" }).success).toBe(false);
  });
});

