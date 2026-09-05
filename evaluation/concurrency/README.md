# Concurrent Staff Check-in Reliability Evaluation

## Objective
Evaluate the system's reliability and concurrency controls when multiple staff members simultaneously attempt to check in attendees. This evaluation specifically focuses on the **same-guest race condition** across 10 repeated, independent trials to test atomic compare-and-swap semantics and guarantee zero duplicate attendance records.

## Core Scenario: Same-Guest Race Condition
```
20 simultaneous requests
        ↓
    SAME guest
        ↓
Only ONE check-in succeeds (HTTP 200)
        ↓
Remaining 19 requests rejected (HTTP 409 Conflict)
        ↓
Database contains exactly ONE attendance record
```

## Concurrency Protection Architecture
The Retirement Party Guest Management System uses multi-layered defense against race conditions:
1. **MongoDB Atomic `findOneAndUpdate`**: State transition condition enforces `{ attending: true, $or: [{ checkedIn: { $ne: true } }, { checkedIn: { $exists: false } }, { status: { $ne: "CHECKED_IN" } }] }`. Only the first concurrent request matching this condition mutates state; subsequent requests match 0 documents and return `null`, prompting the service to raise `ALREADY_CHECKED_IN` (HTTP 409).
2. **Unique Database Constraint**: Unique index `idx_checkins_guestId_unique` on the `checkins` collection prevents duplicate check-in audit records even under extreme edge-case conditions.
3. **Cache Invalidation**: Upon check-in, both the guest's phone key and confirmation code key are invalidated from Redis cache.
4. **No Multi-Document Transactions Needed**: Concurrency safety is achieved via single-document atomic compare-and-swap and database unique constraints without the latency penalty of distributed transactions.

## Multi-Trial Methodology (10 Independent Trials)
Each of the 10 independent trials executes the following lifecycle:
1. **Fresh Attendee State**: Starts with an attendee document not checked in (`checkedIn: false`, `status: "REGISTERED"`).
2. **Simultaneous Execution**: Dispatches 20 concurrent HTTP requests via `Promise.all()` to `POST /verification/check-in`.
3. **Completion Barrier**: Waits for all 20 HTTP requests to resolve.
4. **Direct Database Verification**: Inspects MongoDB `checkins` collection to verify exactly 1 checkin document exists and no duplicates were inserted.
5. **Guest State Audit**: Verifies `guests` collection document has `checkedIn: true`, `status: "CHECKED_IN"`, valid timestamp, and staff audit identity.
6. **Data Reset**: Completely tears down and resets test data before the subsequent trial.

## Reproduction Commands
```bash
# 1. Run concurrency test suite via Jest (6 baseline scenarios + 10 repeated trials)
cd retirement-party-verification-service
node --experimental-vm-modules --experimental-require-module node_modules/jest/bin/jest.js --config ../evaluation/jest.config.js evaluation/concurrency/test_concurrent_checkins.test.js

# 2. Or run the full multi-trial evaluation suite
node ../evaluation/run_evaluation.js
```

## Results Artifacts
- Raw trial results: [`evaluation/result/concurrency_repeated_results.json`](../result/concurrency_repeated_results.json)
- Full performance report: [`evaluation/result/final_performance_report.json`](../result/final_performance_report.json)
