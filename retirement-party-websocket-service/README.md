# Retirement Party WebSocket Service

A dedicated, lightweight real-time notification microservice for the Retirement Party Guest Management System.

## Architecture

```
                  ADMIN FRONTEND (:3000)
                            │
                    socket.io-client
                            │
                            ▼
                   WEBSOCKET SERVICE (:4001)
                            ▲
                            │ internal HTTP POST /internal/events
             ┌──────────────┴──────────────┐
             │                             │
    VERIFICATION SERVICE (:5002)   REGISTRATION SERVICE (:5001)
             │                             │
             ▼                             ▼
          MongoDB                       MongoDB
```

### Architectural Principles

1. **WebSocket = Notification, REST = Authoritative Data**: The WebSocket Service only informs the Admin Frontend that "something changed." The frontend then re-fetches authoritative data via the existing REST APIs (API Gateway / Analytics Service / Registration Service).
2. **No MongoDB**: The WebSocket Service does NOT connect to MongoDB. It is purely an in-memory connection and event broker.
3. **No Redis (Single Instance)**: Redis is not needed for single-instance operation. Redis adapter can be added if scaling across multiple instances.
4. **Fire-and-Forget Internal Communication**: Verification and Registration services notify the WebSocket Service via `POST /internal/events`. If the WebSocket Service is unavailable, check-in and registration operations STILL SUCCEED and never rollback.
5. **Admin Room & Strict Auth**: Only authenticated active `ADMIN` users can join the `admin-dashboard` Socket.IO room.

## Endpoints

### Public / Client:
- `ws://localhost:4001` - Socket.IO server (Handshake requires Firebase ID Token in `auth.token`)
- `GET /health` - Health check endpoint
- `GET /health/metrics` - Safe runtime operational metrics

### Internal Service-to-Service:
- `POST /internal/events` - Broadcast event (Protected by `INTERNAL_SERVICE_TOKEN` Bearer auth)

## Events

- `CHECKIN_COMPLETED`: Broadcast when a guest is checked in by staff.

## Running Locally

```bash
npm install
npm run dev
```

## Running Tests

```bash
npm test
```

