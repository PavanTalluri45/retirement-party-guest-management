import {
  TrendQuerySchema,
  PaginationQuerySchema,
  validateQuery,
} from "../../src/validators/analytics.validator.js";

describe("Analytics Validators", () => {
  describe("TrendQuerySchema", () => {
    it("should validate empty query params with defaults", () => {
      const result = validateQuery(TrendQuerySchema, {});
      expect(result.granularity).toBe("hour");
    });

    it("should accept valid date range", () => {
      const result = validateQuery(TrendQuerySchema, {
        from: "2026-08-01",
        to: "2026-08-30",
        granularity: "day",
      });
      expect(result.from).toBe("2026-08-01");
      expect(result.to).toBe("2026-08-30");
      expect(result.granularity).toBe("day");
    });

    it("should throw error when 'from' date is after 'to' date", () => {
      expect(() => {
        validateQuery(TrendQuerySchema, {
          from: "2026-08-30",
          to: "2026-08-01",
        });
      }).toThrow("Validation Error");
    });

    it("should throw error for invalid date format", () => {
      expect(() => {
        validateQuery(TrendQuerySchema, {
          from: "invalid-date",
        });
      }).toThrow("Validation Error");
    });

    it("should throw error for unsupported granularity", () => {
      expect(() => {
        validateQuery(TrendQuerySchema, {
          granularity: "month",
        });
      }).toThrow("Validation Error");
    });
  });

  describe("PaginationQuerySchema", () => {
    it("should apply default page and limit", () => {
      const result = validateQuery(PaginationQuerySchema, {});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should parse numeric strings", () => {
      const result = validateQuery(PaginationQuerySchema, {
        page: "2",
        limit: "25",
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
    });

    it("should reject limit > 50", () => {
      expect(() => {
        validateQuery(PaginationQuerySchema, {
          limit: "100",
        });
      }).toThrow("Validation Error");
    });

    it("should reject page < 1", () => {
      expect(() => {
        validateQuery(PaginationQuerySchema, {
          page: "0",
        });
      }).toThrow("Validation Error");
    });
  });
});

