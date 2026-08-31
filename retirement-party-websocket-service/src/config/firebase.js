import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

/**
 * Firebase Admin SDK initialization for the WebSocket Service.
 *
 * Follows the same established convention as the Auth Service:
 *   - Primary: ServiceAccountKey.json (placed in the service root directory)
 *   - Fallback: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars
 *   - Test mode: returns a mockable verifier that avoids real network calls
 *
 * This service ONLY uses Firebase Admin for:
 *   - Verifying incoming Firebase ID tokens during socket handshake
 * It does NOT write to Firestore or any Firebase database.
 */

const require = createRequire(import.meta.url);

let adminAuthInstance = null;

/**
 * Get or initialize the Firebase Admin Auth instance.
 * Gracefully provides a test-safe auth verifier during automated testing.
 */
export function getAdminAuth() {
  if (adminAuthInstance) return adminAuthInstance;

  // In test environment, return a standard mockable verifier.
  // Tests that need custom behavior can call setAdminAuth(mock) directly.
  if (process.env.NODE_ENV === "test") {
    adminAuthInstance = {
      verifyIdToken: async (token) => {
        if (!token || token === "invalid-token" || token === "expired-token") {
          const err = new Error("Invalid token");
          err.code = "auth/argument-error";
          throw err;
        }
        return {
          uid: "test-firebase-uid",
          email: "admin@event.com",
        };
      },
    };
    return adminAuthInstance;
  }

  const serviceAccountPath = path.resolve(
    process.cwd(),
    "ServiceAccountKey.json"
  );
  const hasKeyFile = fs.existsSync(serviceAccountPath);

  const hasEnvCredentials =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  try {
    const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
    const { getAuth } = require("firebase-admin/auth");

    let firebaseApp;
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else if (hasKeyFile) {
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = initializeApp({ credential: cert(serviceAccount) });
      console.log("[Firebase Admin] Initialized from ServiceAccountKey.json.");
    } else if (hasEnvCredentials) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("[Firebase Admin] Initialized from environment variables.");
    } else {
      console.warn(
        "[Firebase Admin] No credentials found. Socket authentication will be unavailable."
      );
      return null;
    }

    if (firebaseApp) {
      adminAuthInstance = getAuth(firebaseApp);
    }
  } catch (error) {
    console.warn(
      `[Firebase Admin] Could not initialize Admin SDK (${error.message}). Running in fallback mode.`
    );
  }

  return adminAuthInstance;
}

/**
 * Injects a mock auth instance for unit/integration tests.
 */
export function setAdminAuth(mockAuth) {
  adminAuthInstance = mockAuth;
}

export const adminAuth = getAdminAuth();
export default { getAdminAuth, setAdminAuth, adminAuth };
