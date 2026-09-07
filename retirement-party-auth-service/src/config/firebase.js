import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import {
  initializeApp,
  cert,
  getApps,
  getApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const require = createRequire(import.meta.url);

/*
 * Credential priority:
 *   1. Local ServiceAccountKey.json (Service root)
 *   2. Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 *      Recommended for Vercel and container deployments.
 */

const localServiceAccountPath = path.resolve(
  process.cwd(),
  "ServiceAccountKey.json"
);

const serviceAccountPath = localServiceAccountPath;
const hasKeyFile = fs.existsSync(serviceAccountPath);

const hasEnvCredentials =
  Boolean(process.env.FIREBASE_PROJECT_ID) &&
  Boolean(process.env.FIREBASE_CLIENT_EMAIL) &&
  Boolean(process.env.FIREBASE_PRIVATE_KEY);

const apps = getApps();
let app;

if (apps.length > 0) {
  app = getApp();
  console.log(
    "[Firebase Admin] Reusing existing Firebase Admin SDK instance."
  );
} else if (hasKeyFile) {
  const serviceAccount = require(serviceAccountPath);
  app = initializeApp({
    credential: cert(serviceAccount),
  });
  console.log(
    `[Firebase Admin] Firebase Admin SDK initialized successfully using ${serviceAccountPath}.`
  );
} else if (hasEnvCredentials) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  console.log(
    "[Firebase Admin] Firebase Admin SDK initialized from environment variables."
  );
} else {
  throw new Error(
    `[Firebase Admin] No Firebase credentials found.

Checked:
- ${localServiceAccountPath}
- FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY

For local development, place ServiceAccountKey.json in the Auth Service root directory.
For Vercel or cloud deployments, configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Environment Variables.`
  );
}

export const adminAuth = getAuth(app);

export const admin = {
  app,
  auth: () => adminAuth,
  credential: {
    cert,
  },
};

export default admin;