/**
 * Percentile and Statistical Distribution Calculations
 *
 * Algorithm:
 * - Nearest Rank Method / Clamped Index:
 *   index = Math.max(0, Math.min(N - 1, Math.ceil(p * N) - 1))
 * - Time Complexity: O(N log N) for sorting N bounded samples
 * - Space Complexity: O(N) copy of samples
 */

/**
 * Calculate specific percentile from a sorted numeric array.
 *
 * @param {number[]} sortedArray Ascending sorted array of numbers
 * @param {number} p Percentile in range (0, 1] (e.g. 0.50, 0.95, 0.99)
 * @returns {number}
 */
export function calculatePercentile(sortedArray, p) {
  const N = sortedArray.length;
  if (N === 0) return 0;
  if (N === 1) return sortedArray[0];

  const index = Math.max(0, Math.min(N - 1, Math.ceil(p * N) - 1));
  return sortedArray[index];
}

/**
 * Calculate summary statistics (count, min, max, avg, p50, p95, p99) from an array of numbers.
 *
 * @param {number[]} samples Raw array of latency measurements
 * @returns {{
 *   count: number,
 *   min: number,
 *   max: number,
 *   avg: number,
 *   p50: number,
 *   p95: number,
 *   p99: number
 * }}
 */
export function calculateLatencyStats(samples) {
  if (!samples || samples.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = Number((sum / count).toFixed(2));
  const min = sorted[0];
  const max = sorted[count - 1];
  const p50 = calculatePercentile(sorted, 0.5);
  const p95 = calculatePercentile(sorted, 0.95);
  const p99 = calculatePercentile(sorted, 0.99);

  return {
    count,
    min,
    max,
    avg,
    p50,
    p95,
    p99,
  };
}

export default {
  calculatePercentile,
  calculateLatencyStats,
};
