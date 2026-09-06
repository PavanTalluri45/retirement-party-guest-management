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
 * Local development:
 *   retirement-party-auth-service/ServiceAccountKey.json
 *
 * Render:
 *   Secret Files are mounted at:
 *   /etc/secrets/ServiceAccountKey.json
 */

const localServiceAccountPath = path.resolve(
  process.cwd(),
  "ServiceAccountKey.json"
);

const renderServiceAccountPath =
  "/etc/secrets/ServiceAccountKey.json";

/*
 * Prefer the Render Secret File when running on Render.
 * Fall back to the local file for development.
 */
const serviceAccountPath = fs.existsSync(renderServiceAccountPath)
  ? renderServiceAccountPath
  : localServiceAccountPath;

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `[Firebase Admin] ServiceAccountKey.json not found.

Checked:
- ${renderServiceAccountPath}
- ${localServiceAccountPath}

For local development, place ServiceAccountKey.json in the Auth Service root directory.
For Render, add ServiceAccountKey.json under Environment → Secret Files.`
  );
}

const serviceAccount = require(serviceAccountPath);

/*
 * Prevent duplicate Firebase Admin initialization
 * during development or repeated imports.
 */
const apps = getApps();

const app = apps.length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
    });

console.log(
  `[Firebase Admin] Firebase Admin SDK initialized successfully using ${serviceAccountPath}.`
);

export const adminAuth = getAuth(app);

export const admin = {
  app,
  auth: () => adminAuth,
  credential: {
    cert,
  },
};

export default admin;