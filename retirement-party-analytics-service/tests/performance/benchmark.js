import "dotenv/config";
import { connectDB, closeDB } from "../../src/config/database.js";
import { analyticsService } from "../../src/services/analytics.service.js";
import { analyticsCache } from "../../src/services/analytics-cache.service.js";
import { calculatePercentiles, startTimer } from "../../src/utils/latency.js";

async function runBenchmark() {
  console.log("==================================================");
  console.log("Analytics Service Performance Benchmark");
  console.log("==================================================");

  try {
    await connectDB();
    console.log("[Benchmark] Connected to MongoDB Atlas.");

    const ITERATIONS = 30;

    // 1. Cold Cache Benchmark (Direct MongoDB Aggregation)
    console.log(`\n[Benchmark] 1. Direct MongoDB Aggregation (Cold Cache) - ${ITERATIONS} iterations:`);
    const coldLatencies = [];

    for (let i = 0; i < ITERATIONS; i++) {
      await analyticsCache.delete("analytics:v1:summary");
      const timer = startTimer();
      await analyticsService.getSummary();
      const durationMs = timer.stop();
      coldLatencies.push(durationMs);
    }

    const coldStats = calculatePercentiles(coldLatencies);
    console.log(`  - Samples: ${coldStats.count}`);
    console.log(`  - Min:     ${coldStats.min} ms`);
    console.log(`  - Avg:     ${coldStats.avg} ms`);
    console.log(`  - p50:     ${coldStats.p50} ms`);
    console.log(`  - p90:     ${coldStats.p90} ms`);
    console.log(`  - p95:     ${coldStats.p95} ms`);
    console.log(`  - p99:     ${coldStats.p99} ms`);
    console.log(`  - Max:     ${coldStats.max} ms`);

    // 2. Warm Cache Benchmark (Upstash Redis Cache Hits)
    console.log(`\n[Benchmark] 2. Upstash Redis Cache Hits (Warm Cache) - ${ITERATIONS} iterations:`);
    // Warm up the cache with 1 run
    await analyticsService.getSummary();
    const warmLatencies = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const timer = startTimer();
      const res = await analyticsService.getSummary();
      const durationMs = timer.stop();
      if (res.cacheHit) {
        warmLatencies.push(durationMs);
      }
    }

    if (warmLatencies.length > 0) {
      const warmStats = calculatePercentiles(warmLatencies);
      console.log(`  - Samples: ${warmStats.count}`);
      console.log(`  - Min:     ${warmStats.min} ms`);
      console.log(`  - Avg:     ${warmStats.avg} ms`);
      console.log(`  - p50:     ${warmStats.p50} ms`);
      console.log(`  - p90:     ${warmStats.p90} ms`);
      console.log(`  - p95:     ${warmStats.p95} ms`);
      console.log(`  - p99:     ${warmStats.p99} ms`);
      console.log(`  - Max:     ${warmStats.max} ms`);

      const speedup = (coldStats.avg / warmStats.avg).toFixed(1);
      console.log(`\n[Benchmark Result] Cache speedup: ~${speedup}x faster on average.`);
    } else {
      console.log("  (Redis not configured or no cache hits recorded)");
    }

    console.log("\n==================================================");
  } catch (error) {
    console.error("[Benchmark] Failed:", error.message);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

runBenchmark();

