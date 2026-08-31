import { getAdminAuth } from "../config/firebase.js";
import { config } from "../config/env.js";

/**
 * Socket.IO authentication and authorization middleware.
 *
 * Called once per connection attempt BEFORE the socket is accepted.
 *
 * Flow:
 *   1. Read token from socket.handshake.auth.token
 *      (NEVER from query params — tokens must not appear in URLs/logs)
 *   2. Verify Firebase ID Token → get firebaseUid
 *   3. Call Auth Service GET /api/auth/me to verify:
 *      - role === "ADMIN"
 *      - isActive === true
 *      (WebSocket Service cannot query MongoDB directly — uses Auth Service HTTP API)
 *   4. Attach user identity to socket.data for downstream use
 *   5. Reject any connection that fails steps 1-3
 *
 * SECURITY:
 * - The browser is NEVER trusted to send role information.
 * - Token is verified cryptographically by Firebase Admin SDK.
 * - Authorization is verified by the authoritative Auth Service (MongoDB users collection).
 * - Tokens are never logged.
 *
 * @param {import('socket.io').Socket} socket
 * @param {Function} next
 */
export async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required."));
    }

    // Step 1: Verify Firebase ID Token
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return next(new Error("Authentication service unavailable."));
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token, true);
    } catch (firebaseError) {
      const code = firebaseError.code || "";
      if (
        code === "auth/id-token-expired" ||
        code === "auth/argument-error"
      ) {
        return next(new Error("Authentication token expired or invalid."));
      }
      if (code === "auth/id-token-revoked") {
        return next(new Error("Authentication token has been revoked."));
      }
      return next(new Error("Invalid authentication token."));
    }

    const firebaseUid = decodedToken.uid;
    if (!firebaseUid) {
      return next(new Error("Invalid authentication token."));
    }

    // Step 2: Verify Admin authorization via Auth Service
    // We pass the Firebase ID Token so the Auth Service can perform its own verification
    let appUser;
    try {
      appUser = await fetchUserProfile(token);
    } catch (fetchError) {
      console.error("[SocketAuth] Auth Service unavailable:", fetchError.message);
      return next(new Error("Authorization service temporarily unavailable."));
    }

    if (!appUser) {
      return next(new Error("User profile not found. Please complete registration."));
    }

    if (!appUser.isActive) {
      return next(new Error("Account is inactive. Please contact an administrator."));
    }

    if (appUser.role !== "ADMIN") {
      return next(
        new Error("Access denied: Admin role required for this connection.")
      );
    }

    // Step 3: Attach verified identity — never store the raw token
    socket.data.user = {
      firebaseUid,
      role: appUser.role,
      name: appUser.name || "",
      email: appUser.email || "",
    };

    next();
  } catch (err) {
    console.error("[SocketAuth] Unexpected error during authentication:", err.message);
    next(new Error("Authentication failed."));
  }
}

/**
 * Calls the Auth Service /api/auth/me endpoint to retrieve and verify
 * the authenticated user's application profile.
 *
 * This is the correct approach when WebSocket Service cannot use MongoDB directly.
 *
 * @param {string} token - Firebase ID Token (used as Bearer token)
 * @returns {Promise<object|null>} application user profile
 */
async function fetchUserProfile(token) {
  const url = `${config.authServiceUrl}/api/auth/me`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(5000), // 5 second timeout
  });

  if (response.status === 404 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Auth Service returned ${response.status}`);
  }

  const body = await response.json();
  return body?.data?.user || null;
}

export default { socketAuthMiddleware };
