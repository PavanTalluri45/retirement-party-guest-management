# Retirement Party Analytics Service

High-performance, read-only analytics and reporting microservice for the Retirement Party Guest Management System.

## Architecture Overview

- **Port**: `5003`
- **Role**: Read-only aggregation and metrics provider for the Admin Dashboard.
- **Database**: MongoDB Atlas (`retirement_party` database).
- **Optimization**: Short-TTL caching via Upstash Redis (`analytics:v1:summary`) with graceful fallback.
- **Security**: Strict Admin authorization enforced by API Gateway (`:4000`).

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health and dependency connectivity (MongoDB, Redis) |
| `GET` | `/analytics/summary` | Core dashboard summary (registrations, attendance, meals) |
| `GET` | `/analytics/registrations` | Registration breakdown (total, attending, notAttending) |
| `GET` | `/analytics/attendance` | Attendance metrics (expected, attended, remaining, percentage) |
| `GET` | `/analytics/meals` | Meal preferences (vegetarian, nonVegetarian across all guests/family) |
| `GET` | `/analytics/checkins` | Check-in statistics (total successful, today) |
| `GET` | `/analytics/checkins/trend` | Time-bucketed check-in trend (`from`, `to`, `granularity`) |
| `GET` | `/analytics/staff/checkins` | Staff check-in leaderboard |
| `GET` | `/analytics/checkins/recent` | Recent successful check-in records (`limit`) |
| `GET` | `/analytics/metrics` | In-memory operational metrics and latency percentiles |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Service port | `5003` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGO_URI` | MongoDB Atlas connection string | required |
| `DB_NAME` | Database name | `retirement_party` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | optional |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | optional |
| `ANALYTICS_CACHE_TTL_SECONDS` | Summary cache TTL | `15` |

## Testing

```bash
# Run Jest test suite
npm test

# Run tests with coverage
npm run test:coverage
```

