import { getRedisClient, isRedisConfigured } from "../config/redis.js";
import { config } from "../config/env.js";
import { metrics } from "../utils/metrics.js";

const DEFAULT_TTL_SECONDS = config.analyticsCacheTtlSeconds || 15;

/**
 * Analytics Cache Service
 * Provides short-TTL caching for read-heavy analytics queries with graceful failure handling.
 */
export class AnalyticsCacheService {
  constructor(ttl = DEFAULT_TTL_SECONDS) {
    this.ttl = ttl;
  }

  /**
   * Retrieve cached data. Returns null on cache miss, unconfigured Redis, or failure.
   *
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    if (!isRedisConfigured()) {
      return null;
    }

    const redis = getRedisClient();
    if (!redis) return null;

    try {
      const cached = await redis.get(key);
      if (cached !== null && cached !== undefined) {
        metrics.recordCacheHit();
        // If stringified JSON, parse it
        if (typeof cached === "string") {
          try {
            return JSON.parse(cached);
          } catch {
            return cached;
          }
        }
        return cached;
      }
      metrics.recordCacheMiss();
      return null;
    } catch (err) {
      metrics.recordCacheError();
      console.warn(`[Analytics Cache] Read error for key "${key}":`, err.message);
      return null;
    }
  }

  /**
   * Set cached data with expiration.
   *
   * @param {string} key
   * @param {any} data
   * @param {number} [ttlSeconds]
   */
  async set(key, data, ttlSeconds = this.ttl) {
    if (!isRedisConfigured()) {
      return false;
    }

    const redis = getRedisClient();
    if (!redis) return false;

    try {
      const payload = typeof data === "object" ? JSON.stringify(data) : data;
      await redis.set(key, payload, { ex: ttlSeconds });
      return true;
    } catch (err) {
      metrics.recordCacheError();
      console.warn(`[Analytics Cache] Write error for key "${key}":`, err.message);
      return false;
    }
  }

  /**
   * Delete cached key.
   */
  async delete(key) {
    if (!isRedisConfigured()) return false;
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      await redis.del(key);
      return true;
    } catch (err) {
      console.warn(`[Analytics Cache] Delete error for key "${key}":`, err.message);
      return false;
    }
  }
}

export const analyticsCache = new AnalyticsCacheService();
export default analyticsCache;

