import { config } from "../config/env.js";
import { calculatePercentiles } from "./latency.js";

/**
 * Bounded In-Memory Metrics Collector
 * Tracks operational counters and latency distributions safely without unbounded memory growth.
 */
class MetricsCollector {
  constructor(maxSamples = config.maxLatencySamples) {
    this.maxSamples = maxSamples;
    this.reset();
  }

  reset() {
    this.counters = {
      requestsTotal: 0,
      requestsSuccess: 0,
      requestsError: 0,
      cacheHit: 0,
      cacheMiss: 0,
      cacheError: 0,
      databaseError: 0,
    };

    this.endpointRequests = new Map(); // endpoint -> count
    this.endpointLatencies = new Map(); // endpoint -> number[] (bounded)
    this.summaryLatencies = []; // bounded array for /analytics/summary
    this.startTime = Date.now();
  }

  recordRequest(endpoint, durationMs, success = true) {
    this.counters.requestsTotal++;
    if (success) {
      this.counters.requestsSuccess++;
    } else {
      this.counters.requestsError++;
    }

    // Record per-endpoint count (O(1) Map lookup)
    const currentCount = this.endpointRequests.get(endpoint) || 0;
    this.endpointRequests.set(endpoint, currentCount + 1);

    // Record latency in bounded buffer (FIFO eviction)
    if (!this.endpointLatencies.has(endpoint)) {
      this.endpointLatencies.set(endpoint, []);
    }
    const samples = this.endpointLatencies.get(endpoint);
    if (samples.length >= this.maxSamples) {
      samples.shift();
    }
    samples.push(durationMs);

    if (endpoint === "/analytics/summary" || endpoint === "summary") {
      if (this.summaryLatencies.length >= this.maxSamples) {
        this.summaryLatencies.shift();
      }
      this.summaryLatencies.push(durationMs);
    }
  }

  recordCacheHit() {
    this.counters.cacheHit++;
  }

  recordCacheMiss() {
    this.counters.cacheMiss++;
  }

  recordCacheError() {
    this.counters.cacheError++;
  }

  recordDatabaseError() {
    this.counters.databaseError++;
  }

  getSnapshot() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const endpoints = {};

    for (const [endpoint, count] of this.endpointRequests.entries()) {
      const latencies = this.endpointLatencies.get(endpoint) || [];
      endpoints[endpoint] = {
        totalRequests: count,
        latency: calculatePercentiles(latencies),
      };
    }

    const totalCacheRequests = this.counters.cacheHit + this.counters.cacheMiss;
    const cacheHitRatePercent = totalCacheRequests > 0
      ? Math.round((this.counters.cacheHit / totalCacheRequests) * 10000) / 100
      : 0;

    return {
      uptimeSeconds,
      counters: { ...this.counters },
      cacheHitRatePercent,
      summaryLatency: calculatePercentiles(this.summaryLatencies),
      endpoints,
    };
  }
}

export const metrics = new MetricsCollector();
export default metrics;

