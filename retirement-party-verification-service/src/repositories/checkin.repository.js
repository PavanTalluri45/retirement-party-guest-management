import { ObjectId } from "mongodb";
import { getDb } from "../config/database.js";

const GUESTS_COLLECTION = "guests";
const CHECKINS_COLLECTION = "checkins";

/**
 * Ensures all required performance indexes exist on startup.
 * Idempotent.
 */
export async function ensureIndexes() {
  const db = getDb();
  const checkinsCol = db.collection(CHECKINS_COLLECTION);
  const guestsCol = db.collection(GUESTS_COLLECTION);

  // 1. Unique index on checkins.guestId to prevent duplicate checkin records
  await checkinsCol.createIndex(
    { guestId: 1 },
    { unique: true, name: "idx_checkins_guestId_unique" }
  );

  // 2. Compound index for staff history query: checkedInBy + checkedInAt DESC
  await checkinsCol.createIndex(
    { checkedInBy: 1, checkedInAt: -1 },
    { name: "idx_checkins_staff_date" }
  );

  // 3. Index on checkedInAt for event-wide analytics/sorting
  await checkinsCol.createIndex(
    { checkedInAt: -1 },
    { name: "idx_checkins_date" }
  );

  // 4. Ensure guests collection has phone and confirmation indexes
  await guestsCol.createIndex(
    { phone: 1 },
    { unique: true, name: "idx_guests_phone_unique" }
  );

  await guestsCol.createIndex(
    { confirmationNumber: 1 },
    { unique: true, sparse: true, name: "idx_guests_confirmationNumber_unique" }
  );

  console.log("[MongoDB] Verification and Check-in indexes verified successfully.");
}

/**
 * Authoritative lookup of a guest document by phone in MongoDB.
 */
export async function findGuestByPhone(phone) {
  const db = getDb();
  return db.collection(GUESTS_COLLECTION).findOne({ phone });
}

/**
 * Authoritative lookup of a guest document by confirmation number in MongoDB.
 */
export async function findGuestByConfirmation(confirmationNumber) {
  const db = getDb();
  return db.collection(GUESTS_COLLECTION).findOne({ confirmationNumber });
}

/**
 * Authoritative lookup of a guest document by ObjectId in MongoDB.
 */
export async function findGuestById(id) {
  const db = getDb();
  const objId = typeof id === "string" ? new ObjectId(id) : id;
  return db.collection(GUESTS_COLLECTION).findOne({ _id: objId });
}

/**
 * Perform atomic, authoritative check-in in MongoDB.
 *
 * Concurrency Safety:
 * - Uses MongoDB atomic `findOneAndUpdate` with pre-condition check.
 * - If 2 staff members attempt concurrent check-in for the same guest,
 *   exactly 1 matches and succeeds; the other fails the condition and receives ALREADY_CHECKED_IN.
 *
 * @param {object} params
 * @param {object} params.guest Authoritative guest document from MongoDB
 * @param {string} params.verificationMethod 'CONFIRMATION' | 'PHONE'
 * @param {string} params.staffId Authenticated staff Firebase UID or user ID
 * @param {string} [params.staffName] Staff display name
 * @param {string} [params.staffEmail] Staff email
 * @returns {Promise<{ guest: object, checkin: object }>}
 */
export async function executeAtomicCheckIn({
  guest,
  verificationMethod,
  staffId,
  staffName = "Staff Member",
  staffEmail = "",
}) {
  const db = getDb();
  const now = new Date();
  const guestObjectId = guest._id instanceof ObjectId ? guest._id : new ObjectId(guest._id);

  // Validate attending status
  if (guest.attending === false) {
    const error = new Error("Cannot check in a non-attending guest.");
    error.type = "NOT_ATTENDING";
    error.status = 422;
    throw error;
  }

  // Atomic state transition on guests collection
  const updateResult = await db.collection(GUESTS_COLLECTION).findOneAndUpdate(
    {
      _id: guestObjectId,
      attending: true,
      $or: [
        { checkedIn: { $ne: true } },
        { checkedIn: { $exists: false } },
        { status: { $ne: "CHECKED_IN" } },
      ],
    },
    {
      $set: {
        checkedIn: true,
        checkedInAt: now,
        checkedInBy: staffId,
        status: "CHECKED_IN",
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  // If update returned null, the guest was already checked in (race condition or previous check-in)
  if (!updateResult) {
    const currentGuest = await db.collection(GUESTS_COLLECTION).findOne({ _id: guestObjectId });
    const error = new Error("Guest has already been checked in.");
    error.type = "ALREADY_CHECKED_IN";
    error.status = 409;
    error.data = {
      guestId: guest._id.toString(),
      name: currentGuest?.name || guest.name,
      checkedInAt: currentGuest?.checkedInAt || null,
      checkedInBy: currentGuest?.checkedInBy || null,
    };
    throw error;
  }

  // Insert authoritative check-in log record
  const checkinDoc = {
    guestId: guestObjectId.toString(),
    guestName: updateResult.name,
    guestPhone: updateResult.phone,
    confirmationNumber: updateResult.confirmationNumber || null,
    familyCount: updateResult.familyCount ?? 1,
    mealPreference: updateResult.mealPreference ?? "VEG",
    familyMembers: updateResult.familyMembers ?? [],
    verificationMethod,
    checkedInBy: staffId,
    checkedInByName: staffName,
    checkedInByEmail: staffEmail,
    checkedInAt: now,
    result: "SUCCESS",
    createdAt: now,
  };

  try {
    const insertResult = await db.collection(CHECKINS_COLLECTION).insertOne(checkinDoc);
    checkinDoc._id = insertResult.insertedId;
  } catch (insertError) {
    // If unique constraint on guestId triggers (edge case)
    if (insertError.code === 11000) {
      console.warn(`[Checkin Repo] Unique index violation for guest ${guestObjectId}. Already recorded.`);
    } else {
      console.error("[Checkin Repo] Failed to insert checkin record:", insertError.message);
    }
  }

  return {
    guest: formatGuestDocument(updateResult),
    checkin: formatCheckinDocument(checkinDoc),
  };
}

/**
 * Fetch paginated check-in history for the current authenticated staff member.
 *
 * @param {object} params
 * @param {string} params.staffId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.search]
 * @returns {Promise<{ checkins: object[], pagination: object }>}
 */
export async function getStaffHistory({ staffId, page = 1, limit = 20, search = "" }) {
  const db = getDb();
  const query = {
    checkedInBy: staffId,
    result: "SUCCESS",
  };

  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { guestName: { $regex: term, $options: "i" } },
      { guestPhone: { $regex: term, $options: "i" } },
      { confirmationNumber: { $regex: term, $options: "i" } },
    ];
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [records, total] = await Promise.all([
    db
      .collection(CHECKINS_COLLECTION)
      .find(query)
      .sort({ checkedInAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray(),
    db.collection(CHECKINS_COLLECTION).countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    checkins: records.map(formatCheckinDocument),
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

/**
 * Calculate check-in summary metrics for a staff member.
 *
 * @param {string} staffId
 * @returns {Promise<{ totalCheckIns: number, todayCheckIns: number, latestCheckIn: string|null }>}
 */
export async function getStaffSummary(staffId) {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalCheckIns, todayCheckIns, latestRecord] = await Promise.all([
    db.collection(CHECKINS_COLLECTION).countDocuments({
      checkedInBy: staffId,
      result: "SUCCESS",
    }),
    db.collection(CHECKINS_COLLECTION).countDocuments({
      checkedInBy: staffId,
      result: "SUCCESS",
      checkedInAt: { $gte: startOfDay },
    }),
    db
      .collection(CHECKINS_COLLECTION)
      .findOne(
        { checkedInBy: staffId, result: "SUCCESS" },
        { sort: { checkedInAt: -1 }, projection: { checkedInAt: 1 } }
      ),
  ]);

  return {
    totalCheckIns,
    todayCheckIns,
    latestCheckIn: latestRecord?.checkedInAt ? latestRecord.checkedInAt.toISOString() : null,
  };
}

/**
 * Format MongoDB Guest document for API output.
 */
function formatGuestDocument(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
    status: doc.checkedIn ? "CHECKED_IN" : "REGISTERED",
  };
}

/**
 * Format MongoDB Checkin document for API output.
 */
function formatCheckinDocument(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: _id ? _id.toString() : undefined,
    ...rest,
    checkedInAt: doc.checkedInAt ? new Date(doc.checkedInAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

export default {
  ensureIndexes,
  findGuestByPhone,
  findGuestByConfirmation,
  findGuestById,
  executeAtomicCheckIn,
  getStaffHistory,
  getStaffSummary,
};
