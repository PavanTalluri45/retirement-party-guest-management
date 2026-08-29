# Retirement Party Verification Service

High-Performance Guest Verification & Check-In Microservice with Upstash Redis Caching, In-Process Single-Flight Request Coalescing, Monotonic Latency Observability, and Fault-Tolerant Fallback.

---

## 1. System Architecture & Component Interactions

The Verification Service is a specialized microservice operating on port `5002`. It acts as the read-optimized gateway for attendee identity validation and the coordinator for authoritative check-ins.

```
                  ┌──────────────────────────────┐
                  │  Staff Frontend (Port 3001)  │
                  └──────────────┬───────────────┘
                                 │ HTTP (Bearer ID Token)
                                 ▼
                  ┌──────────────────────────────┐
                  │   API Gateway (Port 4000)    │
                  │  Auth + Rate Limit + Trace   │
                  └──────────────┬───────────────┘
                                 │ HTTP + X-Request-ID
                                 ▼
         ┌─────────────────────────────────────────────────┐
         │      Verification Service (Port 5002)           │
         │                                                 │
         │  ┌───────────────────────────────────────────┐  │
         │  │   In-Process Single-Flight Request Map   │  │
         │  └─────────────────────┬─────────────────────┘  │
         └────────────┬───────────┴───────────┬────────────┘
                      │                       │
         (Cache-Aside Read)          (Authoritative Write)
                      ▼                       ▼
            ┌──────────────────┐    ┌──────────────────┐
            │  Upstash Redis   │    │  MongoDB Atlas   │
            │   (Read Cache)   │    │ (Source of Truth)│
            └─────────┬────────┘    └─────────┬────────┘
                      │                       │
                  Cache Miss                  │
                      ▼                       ▼
            ┌──────────────────┐    ┌──────────────────┐
            │ Registration Svc │    │  'checkins' &    │
            │   (Port 5001)    │    │  'guests' Tables │
            └──────────────────┘    └──────────────────┘
```

---

## 2. Engineering Decisions & Architectural Rationale

### Why Redis & Upstash?
- **Sub-millisecond Read Latency**: Verification during live event check-in is highly read-heavy (frequent scans, queries, and repeated lookups). In-memory caching provides deterministic $p50 < 1\text{ ms}$ latency for warm entries.
- **Upstash Serverless Redis**: Provides standard Redis protocol support over secure HTTPS REST and TLS, eliminating connection limits and operational cluster maintenance.

### Why Cache-Aside Pattern?
- The Cache-Aside (Lazy Loading) pattern ensures that only actively queried guests are loaded into memory.
- If Redis restarts or is flushed, entries are automatically repopulated on demand from the Registration Service.
- Redis remains strictly a **read cache**; it never participates in dirty writes or uncommitted transactions.

### Why Redis is NOT the Source of Truth
- Distributed read caches can experience eviction, network partitions, or transient unavailability.
- **MongoDB Atlas** remains the single authoritative source of truth for event attendee registrations and check-in states.
- System correctness is never compromised if Redis is lost or degraded.

### Why Finite TTL & Dual Invalidation?
- **Configurable TTL (`VERIFICATION_CACHE_TTL_SECONDS=60`)**: Acts as a safety net against stale cache data and automatically frees memory for inactive guests.
- **Explicit Invalidation**: Upon a successful authoritative check-in, the service immediately deletes **both** the phone key (`verification:v1:guest:phone:<phone>`) and the confirmation key (`verification:v1:guest:confirmation:<code>`) to ensure immediate consistency for subsequent reads.

### Why Negative Caching with Shorter TTL?
- When a guest is genuinely `NOT_FOUND` (404), writing a negative cache entry (`{ notFound: true }`) with `VERIFICATION_NEGATIVE_CACHE_TTL_SECONDS=10` prevents repeated invalid input or typos from hammering downstream services.
- Transient errors (5xx, timeouts) are **never** negative cached.

### Why In-Process Single-Flight Request Coalescing?
- When 100 concurrent requests arrive for the same cold key, a naive cache miss causes 100 simultaneous downstream calls (Cache Stampede).
- The `inFlightRequests: Map<string, Promise>` coalesces concurrent misses into a single downstream loader call, returning the identical result to all waiting requests.

### Why Check-In Bypasses Cache Authority?
- Check-in is a state-changing write. Relying on cached `status: REGISTERED` is unsafe because another staff member could have checked the guest in milliseconds earlier.
- The write path always queries MongoDB, executes an atomic `findOneAndUpdate` with pre-conditions, records the entry in the `checkins` collection, and invalidates the Redis cache afterwards.

### Why Measure Percentiles ($p50, p95, p99$) instead of Averages?
- Averages hide outlier latency spikes and tail latency caused by network pauses, GC pauses, or connection handshakes.
- Percentiles accurately reflect the real user experience for the 50th, 95th, and 99th percentiles of staff members in the check-in line.

### Why Connection Reuse Matters?
- Reusing singleton MongoClient, Upstash Redis clients, and HTTP connection pools eliminates socket churn, TLS handshake overhead, and ephemeral port exhaustion.

---

## 3. Data Structures and Algorithms (DSA) & Complexity

| Component | Data Structure / Algorithm | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- |
| **Cache Key Normalization** | String sanitizer (preserves leading zeroes) | $O(1)$ (bounded $L \le 20$) | $O(1)$ |
| **Single-Flight Coalescing** | `Map<string, Promise>` | $O(1)$ lookup / insert / delete | $O(K)$ concurrent misses |
| **Latency Sampling** | Bounded Fixed-Array Ring Buffer | $O(1)$ sample push | $O(K)$ ($K=10,000$ cap) |
| **Percentile Calculation** | Nearest Rank with Clamped Index | $O(N \log N)$ sort | $O(N)$ sample copy |
| **Check-In History Query** | MongoDB Compound Index (`{ checkedInBy: 1, checkedInAt: -1 }`) | $O(\log M + \text{limit})$ | $O(\text{limit})$ page memory |

---

## 4. Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5002` | Verification Service HTTP Port |
| `MONGO_URI` | — | MongoDB Atlas Connection String |
| `DB_NAME` | `retirement_party` | MongoDB Database Name |
| `REGISTRATION_SERVICE_URL` | `http://localhost:5001` | Downstream Registration Service URL |
| `UPSTASH_REDIS_REST_URL` | — | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | — | Upstash Redis REST Token |
| `VERIFICATION_CACHE_TTL_SECONDS` | `60` | Normal verification cache TTL (seconds) |
| `VERIFICATION_NEGATIVE_CACHE_TTL_SECONDS`| `10` | Negative cache (404) TTL (seconds) |
| `REDIS_COMMAND_TIMEOUT_MS` | `200` | Redis command timeout (ms) |
| `REGISTRATION_SERVICE_TIMEOUT_MS` | `1500` | Registration service timeout (ms) |
| `MAX_LATENCY_SAMPLES` | `10000` | In-memory ring buffer sample limit |
| `NODE_ENV` | `development` | Node environment (`development` / `production` / `test`) |

---

## 5. API Endpoints

### 1. `POST /verification/confirmation`
- **Auth**: Bearer Firebase ID Token (Role: `STAFF` / `ADMIN`)
- **Body**: `{ "confirmationNumber": "0142" }`
- **Headers**: `Server-Timing`, `X-Verification-Duration-Ms`, `X-Request-ID`

### 2. `POST /verification/phone`
- **Auth**: Bearer Firebase ID Token (Role: `STAFF` / `ADMIN`)
- **Body**: `{ "phone": "9876543210" }`
- **Headers**: `Server-Timing`, `X-Verification-Duration-Ms`, `X-Request-ID`

### 3. `POST /verification/check-in`
- **Auth**: Bearer Firebase ID Token (Role: `STAFF` / `ADMIN`)
- **Body**: `{ "verificationMethod": "CONFIRMATION" | "PHONE", "value": "0142" }`
- **Headers**: `Server-Timing`, `X-CheckIn-Duration-Ms`, `X-Request-ID`

### 4. `GET /verification/history/me?page=1&limit=20&search=`
- **Auth**: Bearer Firebase ID Token (Role: `STAFF` / `ADMIN`)
- **Response**: Paginated check-in records for current staff member + summary metrics.

### 5. `GET /health`
- **Response**: Service status (`healthy` or `degraded` if Redis is offline) + dependency breakdown.

### 6. `GET /health/metrics` or `GET /metrics`
- **Response**: Detailed counters, hit rates, percentile distributions ($p50, p95, p99, \max$) from the ring buffer.

---

## 6. Running Tests & Benchmarks

```powershell
# Run Unit and Integration Tests (Jest + Supertest)
npm test

# Run Performance Benchmark Suite
npm run benchmark
```
