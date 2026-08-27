import { adminAuth } from "../config/firebase.js";
import * as userDb from "../database/user.db.js";

/**
 * Format MongoDB user document to safe API response object
 */
function formatUser(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    firebaseUid: doc.firebaseUid,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isActive: doc.isActive,
    lastLoginAt: doc.lastLoginAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Register a new Admin profile after client creates Firebase user
 */
export async function registerAdmin(firebaseUid, email, { name }) {
  // Check if Firebase UID already has an application profile
  const existingByUid = await userDb.findUserByFirebaseUid(firebaseUid);
  if (existingByUid) {
    const error = new Error("An application profile is already registered for this account.");
    error.statusCode = 409;
    throw error;
  }

  // Check if email is already in use in MongoDB
  const existingByEmail = await userDb.findUserByEmail(email);
  if (existingByEmail) {
    const error = new Error("A user profile with this email address already exists.");
    error.statusCode = 409;
    throw error;
  }

  try {
    const newAdmin = await userDb.createUser({
      firebaseUid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "ADMIN",
      isActive: true,
      lastLoginAt: null,
    });

    return formatUser(newAdmin);
  } catch (mongoError) {
    // Compensation: attempt to remove orphaned Firebase user if MongoDB profile fails
    try {
      await adminAuth.deleteUser(firebaseUid);
      console.warn(`[Compensation] Deleted Firebase user ${firebaseUid} after MongoDB registration failure.`);
    } catch (compensationError) {
      console.error("[Compensation Error] Failed to delete Firebase user during rollback:", compensationError);
    }
    throw mongoError;
  }
}

/**
 * Synchronize user information and update lastLoginAt
 */
export async function syncUser(firebaseUid, email) {
  const user = await userDb.findUserByFirebaseUid(firebaseUid);

  if (!user) {
    const error = new Error("Application user profile not found. Please complete registration.");
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("User account is inactive. Please contact an administrator.");
    error.statusCode = 403;
    throw error;
  }

  const now = new Date();
  const updatedUser = await userDb.updateUserByFirebaseUid(firebaseUid, {
    lastLoginAt: now,
  });

  return formatUser(updatedUser || { ...user, lastLoginAt: now });
}

/**
 * Get current authenticated user profile
 */
export async function getCurrentUser(firebaseUid) {
  const user = await userDb.findUserByFirebaseUid(firebaseUid);

  if (!user) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("User account is inactive. Access denied.");
    error.statusCode = 403;
    throw error;
  }

  return formatUser(user);
}

/**
 * Admin creates a new Staff member (Firebase account + MongoDB profile)
 */
export async function createStaff({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verify email is not already registered in MongoDB
  const existingMongoUser = await userDb.findUserByEmail(normalizedEmail);
  if (existingMongoUser) {
    const error = new Error("A staff member with this email address already exists.");
    error.statusCode = 409;
    throw error;
  }

  // 2. Verify email is not already registered in Firebase Authentication
  try {
    const existingFirebaseUser = await adminAuth.getUserByEmail(normalizedEmail);
    if (existingFirebaseUser) {
      const error = new Error("An authentication account with this email already exists in Firebase.");
      error.statusCode = 409;
      throw error;
    }
  } catch (err) {
    // auth/user-not-found is expected and means email is free to use
    if (err.code !== "auth/user-not-found") {
      throw err;
    }
  }

  // 3. Create Firebase user account using Firebase Admin SDK
  let firebaseUser;
  try {
    firebaseUser = await adminAuth.createUser({
      email: normalizedEmail,
      password,
      displayName: name.trim(),
    });
  } catch (firebaseErr) {
    throw firebaseErr;
  }

  // 4. Create MongoDB application profile
  try {
    const staffDoc = await userDb.createUser({
      firebaseUid: firebaseUser.uid,
      name: name.trim(),
      email: normalizedEmail,
      role: "STAFF",
      isActive: true,
      lastLoginAt: null,
    });

    return formatUser(staffDoc);
  } catch (mongoErr) {
    // 5. Compensation Action: Rollback Firebase user creation if MongoDB insertion fails
    try {
      await adminAuth.deleteUser(firebaseUser.uid);
      console.warn(`[Compensation] Rolled back Firebase user ${firebaseUser.uid} after MongoDB insertion failure.`);
    } catch (compensationErr) {
      console.error("[Compensation Error] Failed to delete Firebase user during rollback:", compensationErr);
    }
    throw mongoErr;
  }
}

/**
 * List all staff members
 */
export async function listStaff() {
  const staffList = await userDb.listStaff();
  return staffList.map(formatUser);
}

/**
 * Get a specific staff member by Firebase UID
 */
export async function getStaff(firebaseUid) {
  const staff = await userDb.findStaffByFirebaseUid(firebaseUid);

  if (!staff) {
    const error = new Error("Staff member not found.");
    error.statusCode = 404;
    throw error;
  }

  return formatUser(staff);
}

/**
 * Update staff active/inactive status (syncs MongoDB + Firebase user state)
 */
export async function updateStaffStatus(firebaseUid, isActive) {
  const staff = await userDb.findStaffByFirebaseUid(firebaseUid);

  if (!staff) {
    const error = new Error("Staff member not found.");
    error.statusCode = 404;
    throw error;
  }

  // 1. Update Firebase disabled status
  await adminAuth.updateUser(firebaseUid, {
    disabled: !isActive,
  });

  // 2. If deactivating, revoke all active Firebase sessions/refresh tokens
  if (!isActive) {
    try {
      await adminAuth.revokeRefreshTokens(firebaseUid);
    } catch (revokeErr) {
      console.warn(`[Warning] Could not revoke refresh tokens for ${firebaseUid}:`, revokeErr.message);
    }
  }

  // 3. Update MongoDB profile
  const updatedStaff = await userDb.updateUserByFirebaseUid(firebaseUid, {
    isActive,
  });

  return formatUser(updatedStaff || { ...staff, isActive });
}

/**
 * Revoke staff member refresh tokens / active sessions
 */
export async function revokeStaffSessions(firebaseUid) {
  const staff = await userDb.findStaffByFirebaseUid(firebaseUid);

  if (!staff) {
    const error = new Error("Staff member not found.");
    error.statusCode = 404;
    throw error;
  }

  await adminAuth.revokeRefreshTokens(firebaseUid);
  return { message: `Refresh tokens for staff member ${staff.name} have been revoked.` };
}

