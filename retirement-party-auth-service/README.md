# Retirement Party Authentication Service (`retirement-party-auth-service`)

The **Authentication Service** is an independent, microservice responsible for bridging **Firebase Authentication** (identity & credential management) and **MongoDB Atlas** (application profiles, roles, and status enforcement) for the Retirement Party Guest Management System.

---

## 1. Overview & Purpose

The service provides:
- **Zero password storage in MongoDB**: Firebase Authentication securely handles email, password, tokens, and sessions.
- **Server-side RBAC (Role-Based Access Control)**: Enforces `ADMIN` and `STAFF` permissions.
- **Controlled Staff Account Creation**: Staff cannot self-register; only authenticated Admins can provision Staff accounts via Firebase Admin SDK and MongoDB.
- **Session Revocation & Deactivation**: Instant account deactivation across Firebase Auth and MongoDB.

---

## 2. Technology Stack

- **Runtime**: Node.js (ES Modules, `"type": "module"`)
- **Web Framework**: Express.js
- **Database**: MongoDB Atlas (Official `mongodb` Node.js driver — no Mongoose, no ORM)
- **Identity & Auth**: Firebase Admin SDK (`firebase-admin`)
- **Validation**: Zod
- **Security**: Helmet, CORS (environment-configured), express-rate-limit
- **Configuration**: dotenv

---

## 3. Architecture & Identity Mapping

```
                               ┌────────────────────────────────┐
                               │     FIREBASE AUTHENTICATION    │
                               │   (Email / Password / Tokens)  │
                               └───────────────┬────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       │                                               │
                       ▼                                               ▼
               [ADMIN PORTAL]                                  [STAFF PORTAL]
              Firebase Client SDK                             Firebase Client SDK
             (Sign In / Register)                                  (Sign In)
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                       Firebase ID Token
                                               │
                                               ▼
                              ┌─────────────────────────────────┐
                              │    RETIREMENT PARTY AUTH SVC    │
                              │       (Express.js Backend)      │
                              ├─────────────────────────────────┤
                              │ 1. Verify Token (Firebase Admin)│
                              │ 2. Extract Firebase UID         │
                              │ 3. Query MongoDB `users` by UID │
                              │ 4. Verify `isActive` and `role` │
                              └────────────────┬────────────────┘
                                               │
                                               ▼
                                  ┌───────────────────────────┐
                                  │       MONGODB ATLAS       │
                                  │   Collection: `users`     │
                                  └───────────────────────────┘
```

### Identity Bridge: `firebaseUid`
- **Firebase Authentication** answers: *"Who is this user? Are their credentials valid?"*
- **MongoDB Atlas** answers: *"What permissions does this user have in this application?"*
- `firebaseUid` is the immutable primary key linking the two systems.

---

## 4. Folder Structure

```
retirement-party-auth-service/
├── src/
│   ├── config/
│   │   ├── env.js             # Environment variable validation & exports
│   │   ├── database.js        # MongoDB client connection & pool management
│   │   └── firebase.js        # Firebase Admin SDK initialization
│   ├── database/
│   │   └── user.db.js         # MongoDB data access layer & index initialization
│   ├── controllers/
│   │   └── auth.controller.js # HTTP request handlers
│   ├── services/
│   │   └── auth.service.js    # Auth business logic & rollback compensation
│   ├── middleware/
│   │   ├── authenticate.js    # Firebase ID Token verification middleware
│   │   ├── authorize.js       # RBAC & active status verification middleware
│   │   └── error-handler.js   # Centralized error handler & status mapper
│   ├── validators/
│   │   └── auth.validator.js  # Zod validation schemas
│   ├── routes/
│   │   └── auth.routes.js     # Express route definitions
│   ├── app.js                 # Express application configuration
│   └── server.js              # Server entry point & startup hooks
├── tests/
│   ├── auth.validator.test.js # Unit tests for Zod validation schemas
│   └── error-handler.test.js  # Unit tests for error handling logic
├── ServiceAccountKey.json     # Firebase Service Account key (LOCAL ONLY, GITIGNORED)
├── .env                       # Local environment variables (GITIGNORED)
├── .env.example               # Environment variables template
├── .gitignore                 # Excludes secrets, keys, and dependencies
├── .dockerignore              # Excludes keys and dependencies from Docker build
├── Dockerfile                 # Production container definition
├── package.json               # Project manifest
└── README.md                  # Complete documentation
```

---

## 5. Security & `ServiceAccountKey.json` Rules

1. **Backend-Only Access**: `ServiceAccountKey.json` contains Google Cloud private keys granting administrative control over the Firebase project.
2. **Never in Frontend**: Neither the Admin, Staff, nor Guest frontend ever receives this file or its credentials.
3. **Never Committed to Git**: `.gitignore` contains strict patterns (`ServiceAccountKey.json`, `*.serviceaccount.json`).
4. **Never Baked in Docker Images**: `.dockerignore` prevents `ServiceAccountKey.json` from entering container images. In production environments (Cloud Run, ECS, Kubernetes), credentials are provided via environment variables or cloud secret managers.

---

## 6. MongoDB `users` Collection

### Schema
```typescript
interface UserDocument {
  _id: ObjectId;              // Auto-generated by MongoDB
  firebaseUid: string;        // Firebase UID (unique identity bridge)
  name: string;               // Display name
  email: string;              // Normalized lowercase email
  role: "ADMIN" | "STAFF";    // Server-enforced role
  isActive: boolean;          // Account status (true = active, false = disabled)
  lastLoginAt: Date | null;   // Timestamp of last session sync
  createdAt: Date;            // Record creation timestamp
  updatedAt: Date;            // Record update timestamp
}
```

### Startup Indexes
The service automatically ensures unique indexes on startup:
```javascript
{ firebaseUid: 1 }, { unique: true }
{ email: 1 }, { unique: true }
```

---

## 7. Authentication & Authorization Workflows

### A. Admin Registration
1. Admin registers on the Admin Frontend via Firebase Client SDK: `createUserWithEmailAndPassword(auth, email, password)`.
2. Frontend immediately retrieves the Firebase ID token: `user.getIdToken()`.
3. Frontend sends `POST /api/auth/admin/register` with `Authorization: Bearer <idToken>` and `{ "name": "Admin Name" }`.
4. Auth Service:
   - Verifies the Firebase ID token using Firebase Admin SDK.
   - Extracts verified `uid` and `email` from the token (ignores any client-provided role or uid).
   - Inserts MongoDB user with `role: "ADMIN"` and `isActive: true`.
   - **Compensation**: If MongoDB insertion fails, deletes the newly created Firebase user to prevent orphaned accounts.

### B. Admin Login
1. Admin enters email/password in the Admin Portal.
2. Frontend signs in via Firebase: `signInWithEmailAndPassword(auth, email, password)`.
3. Frontend calls `GET /api/auth/me` with `Authorization: Bearer <idToken>`.
4. Backend verifies token, fetches MongoDB profile, verifies `role === "ADMIN"` and `isActive === true`, and returns the user profile.

### C. Admin Creates Staff
1. Authenticated Admin fills Staff creation form in Admin Portal.
2. Frontend sends `POST /api/auth/staff` with `{ "name": "Staff Name", "email": "staff@example.com", "password": "temp-password" }`.
3. Backend:
   - Verifies Admin token and checks `role === "ADMIN"`.
   - Validates input with Zod.
   - Checks MongoDB and Firebase for email conflicts.
   - Creates Firebase user via `admin.auth().createUser({ email, password, displayName: name })`.
   - Inserts MongoDB profile with `role: "STAFF"`, `isActive: true`.
   - **Compensation**: If MongoDB insertion fails, rolls back and deletes the Firebase account.
   - Returns safe Staff profile (no password returned or stored).

### D. Staff Login
1. Staff member enters credentials provided by Admin.
2. Frontend signs in via Firebase: `signInWithEmailAndPassword(auth, email, password)`.
3. Frontend calls `GET /api/auth/me` with `Authorization: Bearer <idToken>`.
4. Backend verifies `role === "STAFF"` and `isActive === true`.

### E. Account Deactivation & Session Revocation
- When Admin calls `PATCH /api/auth/staff/:firebaseUid/status` with `{ "isActive": false }`:
  1. Backend sets MongoDB `isActive: false`.
  2. Backend updates Firebase account: `admin.auth().updateUser(uid, { disabled: true })`.
  3. Backend revokes all active Firebase sessions: `admin.auth().revokeRefreshTokens(uid)`.

---

## 8. API Endpoint Reference

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `GET` | `/health` | No | Public | Health status & database connectivity check |
| `GET` | `/` | No | Public | Service welcome & version banner |
| `POST` | `/api/auth/admin/register` | Bearer Token | Authenticated Firebase User | Creates MongoDB `ADMIN` profile for new Admin |
| `POST` | `/api/auth/sync` | Bearer Token | Any active user | Syncs session & updates `lastLoginAt` |
| `GET` | `/api/auth/me` | Bearer Token | `ADMIN`, `STAFF` | Returns current user profile |
| `POST` | `/api/auth/staff` | Bearer Token | `ADMIN` | Provisions new Staff member in Firebase & MongoDB |
| `GET` | `/api/auth/staff` | Bearer Token | `ADMIN` | Lists all Staff members |
| `GET` | `/api/auth/staff/:firebaseUid`| Bearer Token | `ADMIN` | Gets specific Staff member profile |
| `PATCH`| `/api/auth/staff/:firebaseUid/status`| Bearer Token | `ADMIN` | Activates (`true`) or Deactivates (`false`) Staff |
| `POST` | `/api/auth/staff/:firebaseUid/revoke` | Bearer Token | `ADMIN` | Revokes all active refresh tokens for Staff |

---

## 9. Local Setup & Development

### 1. Prerequisites
- Node.js >= 20.x
- MongoDB Atlas account (or local MongoDB >= 6.0)
- Firebase Project with Email/Password Authentication enabled

### 2. Configuration
Create `.env` in `retirement-party-auth-service/`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0
DB_NAME=retirement_party
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

Place `ServiceAccountKey.json` into `retirement-party-auth-service/`.

### 3. Install & Test
```bash
# Install dependencies
npm install

# Run automated tests
npm test

# Start service with hot reload
npm run dev

# Start production server
npm start
```

---

## 10. Postman Testing Guide (Using Real Firebase Authentication)

To test the service in Postman using **real Firebase Authentication**:

### Step 1: Obtain a Real Firebase ID Token
You can obtain a real Firebase ID token via the Firebase Auth REST API:

**Endpoint**:
`POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<YOUR_FIREBASE_API_KEY>`

**Headers**:
`Content-Type: application/json`

**Body**:
```json
{
  "email": "admin@example.com",
  "password": "yourPassword123!",
  "returnSecureToken": true
}
```
**Response**: Copy `idToken` from the response.

---

### Step 2: Test Endpoints in Postman

#### 1. Service Health
- **GET** `http://localhost:5000/health`
- **Expected**: `200 OK`, `database: "connected"`, `status: "healthy"`

#### 2. Admin Registration
- **POST** `http://localhost:5000/api/auth/admin/register`
- **Header**: `Authorization: Bearer <ADMIN_ID_TOKEN>`
- **Body**:
  ```json
  { "name": "Event Organizer Admin" }
  ```
- **Expected**: `201 Created`, user object with `role: "ADMIN"`.

#### 3. Get Current Profile
- **GET** `http://localhost:5000/api/auth/me`
- **Header**: `Authorization: Bearer <ADMIN_ID_TOKEN>`
- **Expected**: `200 OK`, `{ "success": true, "data": { "user": { "role": "ADMIN", ... } } }`

#### 4. Create Staff Member
- **POST** `http://localhost:5000/api/auth/staff`
- **Header**: `Authorization: Bearer <ADMIN_ID_TOKEN>`
- **Body**:
  ```json
  {
    "name": "Check-In Officer",
    "email": "officer@example.com",
    "password": "TemporaryPassword123!"
  }
  ```
- **Expected**: `201 Created`, staff object created in Firebase + MongoDB with `role: "STAFF"`.

#### 5. List Staff Members
- **GET** `http://localhost:5000/api/auth/staff`
- **Header**: `Authorization: Bearer <ADMIN_ID_TOKEN>`
- **Expected**: `200 OK`, array of staff profiles.

#### 6. Deactivate Staff Member
- **PATCH** `http://localhost:5000/api/auth/staff/<STAFF_FIREBASE_UID>/status`
- **Header**: `Authorization: Bearer <ADMIN_ID_TOKEN>`
- **Body**:
  ```json
  { "isActive": false }
  ```
- **Expected**: `200 OK`, `isActive: false`, Firebase account disabled and sessions revoked.

#### 7. Verify Staff Access Blocked
- Attempt to call `GET http://localhost:5000/api/auth/me` with `<DEACTIVATED_STAFF_ID_TOKEN>`.
- **Expected**: `403 Forbidden` (`"Account is inactive. Access denied."`).

---

## 11. Docker Deployment

### Build Image
```bash
docker build -t retirement-party-auth-service:latest .
```

### Run Container
```bash
docker run -d \
  --name auth-service \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e MONGODB_URI="your_atlas_connection_string" \
  -e DB_NAME="retirement_party" \
  -v /path/to/host/ServiceAccountKey.json:/usr/src/app/ServiceAccountKey.json:ro \
  retirement-party-auth-service:latest
```

---

## 12. Future API Gateway Integration

When the `retirement-party-api-gateway` is implemented:
1. Public clients (Admin Portal, Staff Portal) will send requests to the API Gateway.
2. The Gateway will verify rate limits, enforce top-level CORS, and forward requests to `/api/auth/*` on this Auth Service.
3. The Auth Service remains decoupled, headless, and independently scalable.

