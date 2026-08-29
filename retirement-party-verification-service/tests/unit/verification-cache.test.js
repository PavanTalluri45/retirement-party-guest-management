import { jest } from "@jest/globals";
import { VerificationCacheService } from "../../src/services/verification-cache.service.js";
import { setRedisClient } from "../../src/config/redis.js";
import { metricsService } from "../../src/services/metrics.service.js";


describe("Verification Cache Service", () => {
  let cacheService;
  let mockRedis;

  beforeEach(() => {
    metricsService.reset();
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      ping: jest.fn().mockResolvedValue("PONG"),
    };
    setRedisClient(mockRedis);
    cacheService = new VerificationCacheService();
  });

  describe("getGuest", () => {
    it("should return hit = false when Redis returns null", async () => {
      mockRedis.get.mockResolvedValue(null);
      const res = await cacheService.getGuest("key:1");
      expect(res).toEqual({ hit: false, value: null });
    });

    it("should return hit = true with parsed guest on valid Redis payload", async () => {
      const guest = { id: "g1", name: "Alice", phone: "9876543210" };
      mockRedis.get.mockResolvedValue(JSON.stringify(guest));

      const res = await cacheService.getGuest("key:1");
      expect(res).toEqual({ hit: true, notFound: false, value: guest });
    });

    it("should return negative cache result when payload has notFound = true", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ notFound: true }));

      const res = await cacheService.getGuest("key:not-found");
      expect(res).toEqual({ hit: true, notFound: true, value: null });
    });

    it("should handle malformed JSON gracefully by treating as miss and deleting key", async () => {
      mockRedis.get.mockResolvedValue("{ bad json !!");
      mockRedis.del.mockResolvedValue(1);

      const res = await cacheService.getGuest("key:corrupt");
      expect(res.hit).toBe(false);
      expect(res.value).toBe(null);
    });

    it("should handle Redis command rejection gracefully by treating as miss", async () => {
      mockRedis.get.mockRejectedValue(new Error("Connection refused"));

      const res = await cacheService.getGuest("key:err");
      expect(res.hit).toBe(false);
      expect(res.error).toBe(true);
      expect(metricsService.counters.cacheError).toBe(1);
    });
  });

  describe("setGuest", () => {
    it("should serialize compact whitelist and pass TTL to Redis SET", async () => {
      mockRedis.set.mockResolvedValue("OK");
      const guest = {
        _id: "507f1f77bcf86cd799439011",
        name: "Bob",
        phone: "9876543210",
        confirmationNumber: "0142",
        familyCount: 2,
        mealPreference: "VEG",
        secretInternalField: "DO_NOT_CACHE",
      };

      await cacheService.setGuest("key:guest", guest, 60);

      expect(mockRedis.set).toHaveBeenCalledTimes(1);
      const [key, payloadStr, options] = mockRedis.set.mock.calls[0];
      expect(key).toBe("key:guest");
      expect(options).toEqual({ ex: 60 });

      const parsed = JSON.parse(payloadStr);
      expect(parsed.name).toBe("Bob");
      expect(parsed.confirmationNumber).toBe("0142");
      expect(parsed.secretInternalField).toBeUndefined(); // Verify whitelist
    });

    it("should catch SET errors without throwing", async () => {
      mockRedis.set.mockRejectedValue(new Error("Write timeout"));
      await expect(cacheService.setGuest("key:err", { id: "1" })).resolves.not.toThrow();
      expect(metricsService.counters.cacheError).toBe(1);
    });
  });

  describe("cacheNotFound", () => {
    it("should write notFound sentinel with negative TTL", async () => {
      mockRedis.set.mockResolvedValue("OK");
      await cacheService.cacheNotFound("key:404", 10);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "key:404",
        JSON.stringify({ notFound: true }),
        { ex: 10 }
      );
    });
  });

  describe("invalidateGuestKeys", () => {
    it("should delete both phone and confirmation keys simultaneously", async () => {
      mockRedis.del.mockResolvedValue(2);
      await cacheService.invalidateGuestKeys("9876543210", "0142");

      expect(mockRedis.del).toHaveBeenCalledTimes(1);
      const args = mockRedis.del.mock.calls[0];
      expect(args).toContain("verification:v1:guest:phone:9876543210");
      expect(args).toContain("verification:v1:guest:confirmation:0142");
    });
  });
});
