import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { config } from "./env.js";

const require = createRequire(import.meta.url);

/**
 * Firebase Admin SDK initialization for the API Gateway.
 *
 * Strategy (in priority order):
 *  1. Env vars: FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *     → Preferred for Docker / production deployments.
 *  2. ServiceAccountKey.json file in the service root directory
 *     → Convenient for local development (same file used by auth service).
 *
 * If neither source is available the process exits immediately — the Gateway
 * cannot verify Firebase ID tokens without credentials.
 */

let firebaseApp;

const hasEnvCredentials =
  config.firebase.projectId &&
  config.firebase.clientEmail &&
  config.firebase.privateKey;

const serviceAccountPath = path.resolve(process.cwd(), "ServiceAccountKey.json");
const hasKeyFile = fs.existsSync(serviceAccountPath);

if (getApps().length > 0) {
  // Reuse existing app (important during tests)
  firebaseApp = getApp();
  console.log("[Firebase Admin] Reusing existing Firebase Admin SDK instance.");
} else if (hasEnvCredentials) {
  // Option A: initialize from environment variables
  firebaseApp = initializeApp({
    credential: cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
  console.log("[Firebase Admin] Initialized Firebase Admin SDK from environment variables.");
} else if (hasKeyFile) {
  // Option B: initialize from ServiceAccountKey.json
  const serviceAccount = require(serviceAccountPath);
  firebaseApp = initializeApp({
    credential: cert(serviceAccount),
  });
  console.log("[Firebase Admin] Initialized Firebase Admin SDK from ServiceAccountKey.json.");
} else {
  console.error(
    "[Firebase Admin] FATAL: No Firebase credentials found.\n" +
    "  Option A — Set env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY\n" +
    `  Option B — Place ServiceAccountKey.json at: ${serviceAccountPath}`
  );
  process.exit(1);
}

export const adminAuth = getAuth(firebaseApp);
export default adminAuth;
