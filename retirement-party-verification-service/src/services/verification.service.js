import { registrationClient } from "../clients/registration-client.js";
import { verificationCacheService } from "./verification-cache.service.js";
import { metricsService } from "./metrics.service.js";
import {
  buildPhoneGuestKey,
  buildConfirmationGuestKey,
  normalizePhone,
  normalizeConfirmationNumber,
} from "../utils/cache-key.js";
import { startTimer, elapsedMs } from "../utils/latency.js";
import { maskPhone, maskConfirmationCode } from "../utils/masking.js";

/**
 * Verification Service
 *
 * Implements:
 * 1. Cache-Aside pattern (Redis read cache -> Registration Service fallback -> Redis SET)
 * 2. In-Process Single-Flight request coalescing (prevents cache stampedes)
 * 3. Detailed latency breakdown tracking and high-resolution timing
 */
export class VerificationService {
  constructor() {
    /**
     * Single-Flight Request Map: Map<cacheKey, Promise<object>>
     * DSA: O(1) lookup, insert, delete; O(K) memory for K concurrent cache misses.
     */
    this.inFlightRequests = new Map();
  }

  /**
   * Verify an attendee by their 4-digit confirmation code.
   *
   * @param {string} rawConfirmationNumber
   * @param {string} [requestId='req_default']
   * @returns {Promise<{ guest: object, meta: object, timings: object }>}
   */
  async verifyByConfirmationNumber(rawConfirmationNumber, requestId = "req_default") {
    metricsService.increment("requestsTotal");
    const totalStart = startTimer();

    const confirmationNumber = normalizeConfirmationNumber(rawConfirmationNumber);
    const cacheKey = buildConfirmationGuestKey(confirmationNumber);

    // 1. Check Redis Cache
    const cacheStart = startTimer();
    const cacheResult = await verificationCacheService.getGuest(cacheKey);
    const redisGetMs = elapsedMs(cacheStart);
    metricsService.recordCacheLookupLatency(redisGetMs);

    // 2. Cache HIT Path
    if (cacheResult.hit) {
      if (cacheResult.notFound) {
        metricsService.increment("cacheHit");
        metricsService.increment("guestNotFound");
        const totalMs = elapsedMs(totalStart);
        metricsService.recordVerificationLatency(totalMs);

        const error = new Error(`No attendee found with confirmation code ${confirmationNumber}`);
        error.type = "NOT_FOUND";
        error.status = 404;
        throw error;
      }

      metricsService.increment("cacheHit");
      const totalMs = elapsedMs(totalStart);
      metricsService.recordVerificationLatency(totalMs);

      const timings = {
        cache: redisGetMs,
        source: 0,
        cacheWrite: 0,
        total: totalMs,
      };

      console.log(
        JSON.stringify({
          requestId,
          operation: "VERIFY_GUEST",
          method: "CONFIRMATION",
          identifier: maskConfirmationCode(confirmationNumber),
          cacheHit: true,
          source: "redis",
          durationMs: totalMs,
        })
      );

      return {
        guest: cacheResult.value,
        meta: {
          cache: "HIT",
          source: "redis",
          durationMs: totalMs,
          requestId,
        },
        timings,
      };
    }

    // 3. Cache MISS Path: Execute Single-Flight Coalescing
    metricsService.increment("cacheMiss");

    const sourceStart = startTimer();
    const { guest, redisSetMs } = await this._loadWithSingleFlight(
      cacheKey,
      async () => {
        try {
          const fetchedGuest = await registrationClient.fetchGuestByConfirmation(
            confirmationNumber,
            requestId
          );

          metricsService.increment("sourceSuccess");

          // Cache primary key and secondary cross-key if phone exists
          const writeStart = startTimer();
          await verificationCacheService.setGuest(cacheKey, fetchedGuest);

          if (fetchedGuest.phone) {
            try {
              const phoneKey = buildPhoneGuestKey(fetchedGuest.phone);
              verificationCacheService.setGuest(phoneKey, fetchedGuest).catch(() => {});
            } catch {}
          }
          const writeMs = elapsedMs(writeStart);

          return { guest: fetchedGuest, redisSetMs: writeMs };
        } catch (sourceError) {
          if (sourceError.type === "NOT_FOUND" || sourceError.status === 404) {
            metricsService.increment("guestNotFound");
            // Negative cache for 10s to prevent spamming downstream
            await verificationCacheService.cacheNotFound(cacheKey);
          } else {
            metricsService.increment("sourceError");
          }
          throw sourceError;
        }
      }
    );

    const sourceMs = elapsedMs(sourceStart);
    metricsService.recordSourceLookupLatency(sourceMs);

    const totalMs = elapsedMs(totalStart);
    metricsService.recordVerificationLatency(totalMs);

    const timings = {
      cache: redisGetMs,
      source: sourceMs,
      cacheWrite: redisSetMs,
      total: totalMs,
    };

    console.log(
      JSON.stringify({
        requestId,
        operation: "VERIFY_GUEST",
        method: "CONFIRMATION",
        identifier: maskConfirmationCode(confirmationNumber),
        cacheHit: false,
        source: "registration-service",
        durationMs: totalMs,
      })
    );

    return {
      guest,
      meta: {
        cache: "MISS",
        source: "registration-service",
        durationMs: totalMs,
        requestId,
      },
      timings,
    };
  }

  /**
   * Verify an attendee by their registered 10-digit phone number.
   *
   * @param {string} rawPhone
   * @param {string} [requestId='req_default']
   * @returns {Promise<{ guest: object, meta: object, timings: object }>}
   */
  async verifyByPhone(rawPhone, requestId = "req_default") {
    metricsService.increment("requestsTotal");
    const totalStart = startTimer();

    const phone = normalizePhone(rawPhone);
    const cacheKey = buildPhoneGuestKey(phone);

    // 1. Check Redis Cache
    const cacheStart = startTimer();
    const cacheResult = await verificationCacheService.getGuest(cacheKey);
    const redisGetMs = elapsedMs(cacheStart);
    metricsService.recordCacheLookupLatency(redisGetMs);

    // 2. Cache HIT Path
    if (cacheResult.hit) {
      if (cacheResult.notFound) {
        metricsService.increment("cacheHit");
        metricsService.increment("guestNotFound");
        const totalMs = elapsedMs(totalStart);
        metricsService.recordVerificationLatency(totalMs);

        const error = new Error(`No attendee found with phone number ${maskPhone(phone)}`);
        error.type = "NOT_FOUND";
        error.status = 404;
        throw error;
      }

      metricsService.increment("cacheHit");
      const totalMs = elapsedMs(totalStart);
      metricsService.recordVerificationLatency(totalMs);

      const timings = {
        cache: redisGetMs,
        source: 0,
        cacheWrite: 0,
        total: totalMs,
      };

      console.log(
        JSON.stringify({
          requestId,
          operation: "VERIFY_GUEST",
          method: "PHONE",
          identifier: maskPhone(phone),
          cacheHit: true,
          source: "redis",
          durationMs: totalMs,
        })
      );

      return {
        guest: cacheResult.value,
        meta: {
          cache: "HIT",
          source: "redis",
          durationMs: totalMs,
          requestId,
        },
        timings,
      };
    }

    // 3. Cache MISS Path with Single-Flight Coalescing
    metricsService.increment("cacheMiss");

    const sourceStart = startTimer();
    const { guest, redisSetMs } = await this._loadWithSingleFlight(
      cacheKey,
      async () => {
        try {
          const fetchedGuest = await registrationClient.fetchGuestByPhone(phone, requestId);
          metricsService.increment("sourceSuccess");

          // Cache primary key and secondary cross-key if confirmation code exists
          const writeStart = startTimer();
          await verificationCacheService.setGuest(cacheKey, fetchedGuest);

          if (fetchedGuest.confirmationNumber) {
            try {
              const codeKey = buildConfirmationGuestKey(fetchedGuest.confirmationNumber);
              verificationCacheService.setGuest(codeKey, fetchedGuest).catch(() => {});
            } catch {}
          }
          const writeMs = elapsedMs(writeStart);

          return { guest: fetchedGuest, redisSetMs: writeMs };
        } catch (sourceError) {
          if (sourceError.type === "NOT_FOUND" || sourceError.status === 404) {
            metricsService.increment("guestNotFound");
            await verificationCacheService.cacheNotFound(cacheKey);
          } else {
            metricsService.increment("sourceError");
          }
          throw sourceError;
        }
      }
    );

    const sourceMs = elapsedMs(sourceStart);
    metricsService.recordSourceLookupLatency(sourceMs);

    const totalMs = elapsedMs(totalStart);
    metricsService.recordVerificationLatency(totalMs);

    const timings = {
      cache: redisGetMs,
      source: sourceMs,
      cacheWrite: redisSetMs,
      total: totalMs,
    };

    console.log(
      JSON.stringify({
        requestId,
        operation: "VERIFY_GUEST",
        method: "PHONE",
        identifier: maskPhone(phone),
        cacheHit: false,
        source: "registration-service",
        durationMs: totalMs,
      })
    );

    return {
      guest,
      meta: {
        cache: "MISS",
        source: "registration-service",
        durationMs: totalMs,
        requestId,
      },
      timings,
    };
  }

  /**
   * In-Process Single-Flight request loader.
   * If multiple requests for the same cache key arrive concurrently while loading from source,
   * all subsequent requests await the initial in-flight Promise rather than hammering downstream.
   *
   * @template T
   * @param {string} key
   * @param {() => Promise<T>} loaderFn
   * @returns {Promise<T>}
   */
  async _loadWithSingleFlight(key, loaderFn) {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key);
    }

    const loaderPromise = (async () => {
      try {
        return await loaderFn();
      } finally {
        // Guaranteed cleanup in all cases (O(1) deletion)
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, loaderPromise);
    return loaderPromise;
  }
}

export const verificationService = new VerificationService();
export default verificationService;
