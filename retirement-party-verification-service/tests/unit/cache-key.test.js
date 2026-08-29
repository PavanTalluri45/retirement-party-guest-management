import {
  buildPhoneGuestKey,
  buildConfirmationGuestKey,
  normalizePhone,
  normalizeConfirmationNumber,
  CACHE_VERSION,
  CACHE_NAMESPACE,
} from "../../src/utils/cache-key.js";

describe("Cache Key & Normalization Utilities", () => {
  describe("normalizePhone", () => {
    it("should strip spaces and formatting characters to return 10 clean digits", () => {
      expect(normalizePhone(" 9876543210 ")).toBe("9876543210");
      expect(normalizePhone("+91-98765-43210")).toBe("919876543210");
      expect(normalizePhone("(987) 654-3210")).toBe("9876543210");
    });

    it("should throw TypeError for non-string input", () => {
      expect(() => normalizePhone(9876543210)).toThrow(TypeError);
      expect(() => normalizePhone(null)).toThrow(TypeError);
    });
  });

  describe("normalizeConfirmationNumber", () => {
    it("should strictly preserve leading zeroes as a string", () => {
      expect(normalizeConfirmationNumber("0142")).toBe("0142");
      expect(normalizeConfirmationNumber("0001")).toBe("0001");
      expect(normalizeConfirmationNumber(" 0142 ")).toBe("0142");
    });

    it("should never convert to integer or strip zeroes", () => {
      const code = "0042";
      const normalized = normalizeConfirmationNumber(code);
      expect(normalized).toBe("0042");
      expect(normalized.length).toBe(4);
    });

    it("should throw TypeError for non-string input", () => {
      expect(() => normalizeConfirmationNumber(142)).toThrow(TypeError);
    });
  });

  describe("buildPhoneGuestKey", () => {
    it("should generate deterministic versioned key for phone", () => {
      const key = buildPhoneGuestKey("9876543210");
      expect(key).toBe(`${CACHE_NAMESPACE}:${CACHE_VERSION}:guest:phone:9876543210`);
    });

    it("should generate identical key for unnormalized phone input", () => {
      const key1 = buildPhoneGuestKey("9876543210");
      const key2 = buildPhoneGuestKey(" 9876543210 ");
      expect(key1).toBe(key2);
    });
  });

  describe("buildConfirmationGuestKey", () => {
    it("should generate deterministic versioned key for confirmation number", () => {
      const key = buildConfirmationGuestKey("0142");
      expect(key).toBe(`${CACHE_NAMESPACE}:${CACHE_VERSION}:guest:confirmation:0142`);
    });

    it("should preserve leading zeroes in generated key", () => {
      const key = buildConfirmationGuestKey("0007");
      expect(key).toBe(`${CACHE_NAMESPACE}:${CACHE_VERSION}:guest:confirmation:0007`);
    });
  });
});
