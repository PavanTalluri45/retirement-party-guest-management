/**
 * High-Resolution Monotonic Latency Measurement Module
 *
 * Uses `process.hrtime.bigint()` for nanosecond precision immune to wall-clock skew.
 */

/**
 * Start high-resolution timer.
 * @returns {bigint} start timestamp in nanoseconds
 */
export function startTimer() {
  return process.hrtime.bigint();
}

/**
 * Calculate elapsed time in milliseconds from start timestamp.
 *
 * @param {bigint} startTime
 * @param {number} [fractionDigits=2]
 * @returns {number} elapsed milliseconds
 */
export function elapsedMs(startTime, fractionDigits = 2) {
  const endTime = process.hrtime.bigint();
  const diffNs = Number(endTime - startTime);
  const ms = diffNs / 1_000_000;
  return Number(ms.toFixed(fractionDigits));
}

/**
 * Format Server-Timing header value from a timing map.
 * E.g., { cache: 2.1, source: 0, total: 4.5 } -> "cache;dur=2.1, source;dur=0, total;dur=4.5"
 *
 * @param {Record<string, number>} timings
 * @returns {string}
 */
export function formatServerTiming(timings) {
  return Object.entries(timings)
    .filter(([_, dur]) => typeof dur === "number" && !isNaN(dur))
    .map(([metric, dur]) => `${metric};dur=${dur}`)
    .join(", ");
}

export default {
  startTimer,
  elapsedMs,
  formatServerTiming,
};
