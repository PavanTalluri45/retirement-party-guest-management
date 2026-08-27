import { ObjectId } from "mongodb";
import { getDb } from "../config/database.js";

const COLLECTION_NAME = "users";

export function getCollection() {
  return getDb().collection(COLLECTION_NAME);
}

/**
 * Ensures unique indexes for firebaseUid and email on startup.
 */
export async function ensureIndexes() {
  const collection = getCollection();
  
  await collection.createIndex(
    { firebaseUid: 1 },
    { unique: true, name: "idx_users_firebaseUid_unique" }
  );

  await collection.createIndex(
    { email: 1 },
    { unique: true, name: "idx_users_email_unique" }
  );

  console.log("[MongoDB] Unique indexes on 'users' collection ensured (firebaseUid, email).");
}

/**
 * Find user by Firebase UID
 */
export async function findUserByFirebaseUid(firebaseUid) {
  if (!firebaseUid) return null;
  return await getCollection().findOne({ firebaseUid });
}

/**
 * Find user by email (case-insensitive search)
 */
export async function findUserByEmail(email) {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  return await getCollection().findOne({
    email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
  });
}

/**
 * Find user by MongoDB _id
 */
export async function findUserById(id) {
  if (!id) return null;
  try {
    const objectId = typeof id === "string" ? new ObjectId(id) : id;
    return await getCollection().findOne({ _id: objectId });
  } catch {
    return null;
  }
}

/**
 * Create a new user in MongoDB
 */
export async function createUser(userData) {
  const now = new Date();
  const document = {
    firebaseUid: userData.firebaseUid,
    name: userData.name.trim(),
    email: userData.email.trim().toLowerCase(),
    role: userData.role,
    isActive: userData.isActive ?? true,
    lastLoginAt: userData.lastLoginAt ?? null,
    createdAt: userData.createdAt || now,
    updatedAt: userData.updatedAt || now,
  };

  const result = await getCollection().insertOne(document);
  return { _id: result.insertedId, ...document };
}

/**
 * Update user by Firebase UID
 */
export async function updateUserByFirebaseUid(firebaseUid, updateData) {
  if (!firebaseUid) return null;

  const updateDoc = {
    ...updateData,
    updatedAt: new Date(),
  };

  const result = await getCollection().findOneAndUpdate(
    { firebaseUid },
    { $set: updateDoc },
    { returnDocument: "after" }
  );

  return result;
}

/**
 * List all users with role 'STAFF'
 */
export async function listStaff() {
  const staffMembers = await getCollection()
    .find({ role: "STAFF" })
    .sort({ createdAt: -1 })
    .toArray();

  return staffMembers;
}

/**
 * Find staff member specifically by Firebase UID
 */
export async function findStaffByFirebaseUid(firebaseUid) {
  if (!firebaseUid) return null;
  return await getCollection().findOne({ firebaseUid, role: "STAFF" });
}

/**
 * Delete user by Firebase UID (used strictly for compensation rollbacks)
 */
export async function deleteUserByFirebaseUid(firebaseUid) {
  if (!firebaseUid) return null;
  return await getCollection().deleteOne({ firebaseUid });
}

