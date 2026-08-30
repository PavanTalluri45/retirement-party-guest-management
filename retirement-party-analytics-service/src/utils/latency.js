/**
 * High-resolution latency measurement utility using process.hrtime.bigint()
 */

export function startTimer() {
  const start = process.hrtime.bigint();
  return {
    /**
     * Stop the timer and return elapsed milliseconds (float with 2 decimals)
     * @returns {number}
     */
    stop() {
      const end = process.hrtime.bigint();
      const diffNs = Number(end - start);
      return Math.round((diffNs / 1_000_000) * 100) / 100;
    },
  };
}

/**
 * Calculate statistical percentiles (p50, p90, p95, p99, min, max, avg) from an array of numbers.
 * Time complexity: O(N log N) for sorting.
 *
 * @param {number[]} samples
 * @returns {{ count: number, p50: number, p90: number, p95: number, p99: number, min: number, max: number, avg: number }}
 */
export function calculatePercentiles(samples) {
  if (!samples || samples.length === 0) {
    return {
      count: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      avg: 0,
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  const getPercentile = (p) => {
    const idx = Math.ceil((p / 100) * count) - 1;
    return sorted[Math.max(0, Math.min(idx, count - 1))];
  };

  return {
    count,
    p50: getPercentile(50),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
    min: sorted[0],
    max: sorted[count - 1],
    avg: Math.round((sum / count) * 100) / 100,
  };
}

