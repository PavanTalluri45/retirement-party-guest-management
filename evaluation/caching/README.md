# Redis Guest Lookup Performance Evaluation

## Objective
Evaluate the performance improvement delivered by Redis caching for repeated guest lookups in the Verification Service across **10 independent repeated trials** to observe variance and statistical consistency.

## Workload Design
- **Total Requests**: 100 HTTP requests per trial
- **Unique Guest Lookups**: 70 distinct guests
- **Repeated Guest Lookups**: 30 repeat queries for previously requested guests
- **Interleaving**: Repeated requests are distributed throughout the sequence (not grouped at the end) to simulate realistic check-in desk traffic where attendees arrive or re-inquire while new attendees arrive.
- **Deterministic Workload Sequence**: The exact same 100-request sequence is generated once and reused across every trial for both Redis OFF and Redis ON.

## Important Note on Metrics
> [!IMPORTANT]
> The **30% cache hit rate** is an intentional architectural consequence of the synthetic workload design (70 unique requests and 30 repeated requests), **not a discovered production behavior**.  
> The genuine discovered performance findings are:
> 1. The **average response-time reduction** between Redis OFF and Redis ON (measured at ~26% across 10 trials).
> 2. The **number of database queries avoided** (30 queries avoided per 100-request run; 300 queries avoided across 10 trials).

## Multi-Trial Methodology (10 Independent Trials)
For each of the 10 trials:
1. **Redis OFF Benchmark**:
   - Cache disabled (all lookups hit the downstream microservice/database).
   - Simulates downstream service network roundtrip (12ms RPC latency, matching `tests/performance/benchmark.js`).
   - Measures: Avg, Median, P95, Min, Max response time, and DB query count (100).
2. **Clean Cache Reset**:
   - Cache store is explicitly cleared between trials (fresh `new Map()` instance), ensuring zero data carryover from prior runs.
3. **Redis ON Benchmark**:
   - Executes the exact same 100-request sequence with Redis Cache-Aside enabled.
   - Measures: Avg, Median, P95, Min, Max response time, DB query count (70), cache hits (30), cache misses (70), and queries avoided (30).
4. **Statistical Aggregation**:
   - Calculates Mean, Median, Min, Max improvement, and Standard Deviation across all 10 trials.

## Reproduction Commands
```bash
# 1. Run Redis benchmark suite via Jest (baseline + 10 repeated trials)
cd retirement-party-verification-service
node --experimental-vm-modules --experimental-require-module node_modules/jest/bin/jest.js --config ../evaluation/jest.config.js evaluation/caching/test_redis_cache.test.js

# 2. Or run the full multi-trial evaluation suite
node ../evaluation/run_evaluation.js
```

## Results Artifacts
- Raw repeated trial results: [`evaluation/result/redis_repeated_results.json`](../result/redis_repeated_results.json)
- Full performance report: [`evaluation/result/final_performance_report.json`](../result/final_performance_report.json)
