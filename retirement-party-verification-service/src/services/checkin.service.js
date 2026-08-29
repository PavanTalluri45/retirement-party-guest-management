import {
  findGuestByPhone,
  findGuestByConfirmation,
  executeAtomicCheckIn,
  getStaffHistory,
  getStaffSummary,
} from "../repositories/checkin.repository.js";
import { verificationCacheService } from "./verification-cache.service.js";
import { metricsService } from "./metrics.service.js";
import { startTimer, elapsedMs } from "../utils/latency.js";
import { normalizePhone, normalizeConfirmationNumber } from "../utils/cache-key.js";

/**
 * Check-In Service
 *
 * Implements authoritative-first write workflow:
 * 1. Resolve authoritative guest state directly from MongoDB (source of truth)
 * 2. Perform atomic state update and insert check-in log
 * 3. Invalidate both phone and confirmation cache keys in Redis
 */
export class CheckInService {
  /**
   * Check in an attendee.
   *
   * @param {object} params
   * @param {'CONFIRMATION' | 'PHONE'} params.verificationMethod
   * @param {string} params.value Confirmation code or phone number
   * @param {string} params.staffId Authenticated staff user ID or Firebase UID
   * @param {string} [params.staffName] Staff member name
   * @param {string} [params.staffEmail] Staff member email
   * @param {string} [params.requestId='req_default']
   * @returns {Promise<{ guest: object, checkin: object, meta: object, timings: object }>}
   */
  async checkInGuest({
    verificationMethod,
    value,
    staffId,
    staffName = "Staff Member",
    staffEmail = "",
    requestId = "req_default",
  }) {
    const totalStart = startTimer();

    // 1. Resolve authoritative guest state from MongoDB
    const authStart = startTimer();
    let guest = null;

    if (verificationMethod === "CONFIRMATION") {
      const code = normalizeConfirmationNumber(value);
      guest = await findGuestByConfirmation(code);
    } else if (verificationMethod === "PHONE") {
      const phone = normalizePhone(value);
      guest = await findGuestByPhone(phone);
    } else {
      const err = new Error(`Unsupported verification method: ${verificationMethod}`);
      err.type = "VALIDATION_ERROR";
      err.status = 400;
      throw err;
    }

    const authoritativeLookupMs = elapsedMs(authStart);

    if (!guest) {
      const err = new Error(
        `Attendee not found for check-in using ${verificationMethod}: ${value}`
      );
      err.type = "NOT_FOUND";
      err.status = 404;
      throw err;
    }

    // 2. Perform atomic check-in state transition in MongoDB
    const atomicStart = startTimer();
    let checkinResult;
    try {
      checkinResult = await executeAtomicCheckIn({
        guest,
        verificationMethod,
        staffId,
        staffName,
        staffEmail,
      });
      metricsService.increment("checkinSuccess");
    } catch (checkinError) {
      if (
        checkinError.type === "ALREADY_CHECKED_IN" ||
        checkinError.status === 409
      ) {
        metricsService.increment("checkinDuplicate");
      } else {
        metricsService.increment("checkinError");
      }
      throw checkinError;
    }
    const checkInMs = elapsedMs(atomicStart);

    // 3. Multi-Key Redis Invalidation (delete both phone and confirmation keys)
    const invalidationStart = startTimer();
    await verificationCacheService.invalidateGuestKeys(
      guest.phone,
      guest.confirmationNumber
    );
    const cacheInvalidationMs = elapsedMs(invalidationStart);

    const totalMs = elapsedMs(totalStart);
    metricsService.recordCheckinLatency(totalMs);

    const timings = {
      authoritativeLookup: authoritativeLookupMs,
      atomicCheckIn: checkInMs,
      cacheInvalidation: cacheInvalidationMs,
      total: totalMs,
    };

    console.log(
      JSON.stringify({
        requestId,
        operation: "CHECK_IN_GUEST",
        method: verificationMethod,
        guestId: guest._id.toString(),
        staffId,
        result: "SUCCESS",
        durationMs: totalMs,
      })
    );

    return {
      guest: checkinResult.guest,
      checkin: checkinResult.checkin,
      meta: {
        durationMs: totalMs,
        requestId,
      },
      timings,
    };
  }

  /**
   * Get check-in history and summary for the authenticated staff member.
   *
   * @param {object} params
   * @param {string} params.staffId
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.search='']
   * @returns {Promise<{ checkins: object[], pagination: object, summary: object, durationMs: number }>}
   */
  async getStaffHistory({ staffId, page = 1, limit = 20, search = "" }) {
    const start = startTimer();

    const [historyResult, summaryResult] = await Promise.all([
      getStaffHistory({ staffId, page, limit, search }),
      getStaffSummary(staffId),
    ]);

    const durationMs = elapsedMs(start);

    return {
      checkins: historyResult.checkins,
      pagination: historyResult.pagination,
      summary: summaryResult,
      meta: {
        durationMs,
      },
    };
  }
}

export const checkinService = new CheckInService();
export default checkinService;
