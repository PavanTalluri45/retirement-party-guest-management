import { config } from "../config/env.js";
import { executeRedisCommand } from "../config/redis.js";
import { buildPhoneGuestKey, buildConfirmationGuestKey } from "../utils/cache-key.js";
import { metricsService } from "./metrics.service.js";

/**
 * Verification Cache Service
 * Encapsulates all Upstash Redis interactions, compact serialization, negative caching,
 * and resilient error handling following the Cache-Aside pattern.
 */
export class VerificationCacheService {
  /**
   * Look up a guest by deterministic cache key in Redis.
   *
   * @param {string} cacheKey
   * @returns {Promise<{ hit: boolean, notFound?: boolean, value: object|null, error?: boolean }>}
   */
  async getGuest(cacheKey) {
    try {
      const raw = await executeRedisCommand((client) => client.get(cacheKey));

      if (raw === null || raw === undefined) {
        return { hit: false, value: null };
      }

      let parsed;
      if (typeof raw === "object") {
        parsed = raw;
      } else {
        parsed = JSON.parse(raw);
      }

      // Check for negative cache sentinel
      if (parsed && parsed.notFound === true) {
        return { hit: true, notFound: true, value: null };
      }

      // Validate minimal shape
      if (!parsed || (!parsed.id && !parsed._id)) {
        console.warn(`[Cache] Corrupted or invalid payload for key ${cacheKey}. Treating as miss.`);
        this.deleteKey(cacheKey).catch(() => {});
        return { hit: false, value: null };
      }

      return { hit: true, notFound: false, value: parsed };
    } catch (error) {
      metricsService.increment("cacheError");
      console.warn(`[Cache GET Warning] Key ${cacheKey} read failed: ${error.message}. Degraded to source.`);
      return { hit: false, value: null, error: true };
    }
  }

  /**
   * Cache guest verification details with a finite TTL.
   * Caches only the compact whitelist payload required by the verification UI.
   *
   * @param {string} cacheKey
   * @param {object} guest
   * @param {number} [ttlSeconds=config.verificationCacheTtlSeconds]
   */
  async setGuest(cacheKey, guest, ttlSeconds = config.verificationCacheTtlSeconds) {
    if (!guest) return;

    const payload = {
      id: guest.id || (guest._id ? guest._id.toString() : ""),
      name: guest.name,
      phone: guest.phone,
      confirmationNumber: guest.confirmationNumber || null,
      familyCount: guest.familyCount ?? 1,
      mealPreference: guest.mealPreference ?? "VEG",
      familyMembers: guest.familyMembers ?? [],
      attending: guest.attending ?? true,
      status: guest.status || (guest.checkedIn ? "CHECKED_IN" : "REGISTERED"),
      checkedIn: Boolean(guest.checkedIn),
      checkedInAt: guest.checkedInAt || null,
    };

    try {
      await executeRedisCommand((client) =>
        client.set(cacheKey, JSON.stringify(payload), { ex: ttlSeconds })
      );
    } catch (error) {
      metricsService.increment("cacheError");
      console.warn(`[Cache SET Warning] Key ${cacheKey} write failed: ${error.message}`);
    }
  }

  /**
   * Negative Cache: Caches a confirmed GUEST_NOT_FOUND result with a short TTL (e.g. 10s).
   *
   * @param {string} cacheKey
   * @param {number} [ttlSeconds=config.verificationNegativeCacheTtlSeconds]
   */
  async cacheNotFound(cacheKey, ttlSeconds = config.verificationNegativeCacheTtlSeconds) {
    const payload = { notFound: true };
    try {
      await executeRedisCommand((client) =>
        client.set(cacheKey, JSON.stringify(payload), { ex: ttlSeconds })
      );
    } catch (error) {
      metricsService.increment("cacheError");
      console.warn(`[Cache Negative SET Warning] Key ${cacheKey} write failed: ${error.message}`);
    }
  }

  /**
   * Delete a single key from Redis.
   * @param {string} key
   */
  async deleteKey(key) {
    try {
      await executeRedisCommand((client) => client.del(key));
    } catch (error) {
      metricsService.increment("cacheError");
      console.warn(`[Cache DEL Warning] Key ${key} deletion failed: ${error.message}`);
    }
  }

  /**
   * Multi-key invalidation for a guest after check-in.
   * Deletes BOTH phone and confirmation keys to guarantee read consistency.
   *
   * @param {string} [phone]
   * @param {string} [confirmationNumber]
   */
  async invalidateGuestKeys(phone, confirmationNumber) {
    const keysToDelete = [];

    if (phone) {
      try {
        keysToDelete.push(buildPhoneGuestKey(phone));
      } catch {}
    }

    if (confirmationNumber) {
      try {
        keysToDelete.push(buildConfirmationGuestKey(confirmationNumber));
      } catch {}
    }

    if (keysToDelete.length === 0) return;

    try {
      await executeRedisCommand((client) => client.del(...keysToDelete));
    } catch (error) {
      metricsService.increment("cacheError");
      console.warn(
        `[Cache Invalidation Warning] Failed to delete keys [${keysToDelete.join(", ")}]: ${error.message}`
      );
    }
  }
}

export const verificationCacheService = new VerificationCacheService();
export default verificationCacheService;
