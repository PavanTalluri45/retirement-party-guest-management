import { ObjectId } from "mongodb";
import { getDb } from "../config/database.js";

const COLLECTION = "guests";

/**
 * Ensures the required indexes exist on the guests collection.
 * Idempotent — safe to call on every startup.
 */
export async function ensureIndexes() {
  const db = getDb();
  const col = db.collection(COLLECTION);

  // Unique index on phone
  await col.createIndex(
    { phone: 1 },
    { unique: true, name: "idx_guests_phone_unique" }
  );

  // Partial unique index on confirmationNumber (only index string values)
  // This guarantees non-attending guests (with missing or null confirmationNumber)
  // never trigger index collisions.
  try {
    await col.createIndex(
      { confirmationNumber: 1 },
      {
        unique: true,
        partialFilterExpression: { confirmationNumber: { $type: "string" } },
        name: "idx_guests_confirmationNumber_unique",
      }
    );
  } catch (err) {
    // If index exists with old options (e.g. sparse without partialFilter), drop and recreate
    if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
      await col.dropIndex("idx_guests_confirmationNumber_unique");
      await col.createIndex(
        { confirmationNumber: 1 },
        {
          unique: true,
          partialFilterExpression: { confirmationNumber: { $type: "string" } },
          name: "idx_guests_confirmationNumber_unique",
        }
      );
    } else {
      throw err;
    }
  }

  // Index on attendingStatus + registeredAt for reporting queries
  await col.createIndex({ attending: 1, registeredAt: -1 }, { name: "idx_guests_attending_date" });
}

/**
 * Insert a new guest document.
 * @param {object} guestData
 * @returns {Promise<object>} inserted document
 */
export async function insertGuest(guestData) {
  const db = getDb();
  const col = db.collection(COLLECTION);

  const normalizedPhone = typeof guestData?.phone === "string"
    ? guestData.phone.trim().replace(/\D/g, "")
    : guestData?.phone;

  const doc = {
    ...guestData,
    phone: normalizedPhone,
    registeredAt: new Date(),
  };

  if (doc.confirmationNumber == null) {
    delete doc.confirmationNumber;
  }

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Find a guest by their phone number.
 * @param {string} phone
 * @returns {Promise<object|null>}
 */
export async function findByPhone(phone) {
  const db = getDb();
  const normalizedPhone = typeof phone === "string" ? phone.trim().replace(/\D/g, "") : phone;
  return db.collection(COLLECTION).findOne({ phone: normalizedPhone });
}

/**
 * Find an attending guest by their 4-digit confirmation number.
 * @param {string} confirmationNumber
 * @returns {Promise<object|null>}
 */
export async function findByConfirmationNumber(confirmationNumber) {
  const db = getDb();
  return db.collection(COLLECTION).findOne({ confirmationNumber });
}

/**
 * Find a guest by their MongoDB ObjectId.
 * @param {string} id - hex ObjectId string
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
  const db = getDb();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

export async function findAll() {
  const db = getDb();
  return db.collection(COLLECTION).find({}).sort({ registeredAt: -1 }).toArray();
}

/**
 * Check whether a confirmation number is already in use.
 * @param {string} confirmationNumber
 * @returns {Promise<boolean>}
 */
export async function existsByConfirmationNumber(confirmationNumber) {
  const db = getDb();
  const count = await db
    .collection(COLLECTION)
    .countDocuments({ confirmationNumber }, { limit: 1 });
  return count > 0;
}

