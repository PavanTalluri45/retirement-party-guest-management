import { getDb } from "../config/database.js";

const GUESTS_COLLECTION = "guests";
const CHECKINS_COLLECTION = "checkins";
const USERS_COLLECTION = "users";

/**
 * Ensures optimal MongoDB performance indexes for analytics aggregations.
 * Idempotent — safe to run on every startup.
 */
export async function ensureIndexes() {
  const db = getDb();
  const guestsCol = db.collection(GUESTS_COLLECTION);
  const checkinsCol = db.collection(CHECKINS_COLLECTION);
  const usersCol = db.collection(USERS_COLLECTION);

  // 1. Guests indexes for registration and meal queries
  await guestsCol.createIndex(
    { attending: 1, mealPreference: 1 },
    { name: "idx_guests_attending_meal" }
  );
  await guestsCol.createIndex(
    { attending: 1, registeredAt: -1 },
    { name: "idx_guests_attending_date" }
  );

  // 2. Checkins indexes for analytics result matching, dates, and staff aggregation
  await checkinsCol.createIndex(
    { result: 1, checkedInAt: -1 },
    { name: "idx_checkins_result_date" }
  );
  await checkinsCol.createIndex(
    { result: 1, checkedInBy: 1 },
    { name: "idx_checkins_result_staff" }
  );

  // 3. Users index for staff lookups
  await usersCol.createIndex(
    { firebaseUid: 1 },
    { name: "idx_users_firebaseUid" }
  );

  console.log("[MongoDB Analytics] Performance indexes verified successfully.");
}

/**
 * Get registration breakdown: total, attending, notAttending
 */
export async function getRegistrationStats() {
  const db = getDb();
  const [result] = await db
    .collection(GUESTS_COLLECTION)
    .aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          attending: [{ $match: { attending: true } }, { $count: "count" }],
          notAttending: [{ $match: { attending: false } }, { $count: "count" }],
        },
      },
      {
        $project: {
          total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
          attending: { $ifNull: [{ $arrayElemAt: ["$attending.count", 0] }, 0] },
          notAttending: { $ifNull: [{ $arrayElemAt: ["$notAttending.count", 0] }, 0] },
        },
      },
    ])
    .toArray();

  return {
    total: result?.total || 0,
    attending: result?.attending || 0,
    notAttending: result?.notAttending || 0,
  };
}

/**
 * Get attendance overview: expectedAttendees (sum of familyCount for attending=true),
 * totalAttended (count of successful check-ins), remaining, and percentage.
 */
export async function getAttendanceSummary() {
  const db = getDb();

  const [[expectedResult], totalAttended] = await Promise.all([
    db
      .collection(GUESTS_COLLECTION)
      .aggregate([
        { $match: { attending: true } },
        {
          $group: {
            _id: null,
            expectedAttendees: { $sum: { $ifNull: ["$familyCount", 1] } },
          },
        },
      ])
      .toArray(),
    db.collection(CHECKINS_COLLECTION).countDocuments({ result: "SUCCESS" }),
  ]);

  const expectedAttendees = expectedResult?.expectedAttendees || 0;
  const remaining = Math.max(expectedAttendees - totalAttended, 0);
  const attendancePercentage =
    expectedAttendees > 0
      ? Math.round((totalAttended / expectedAttendees) * 10000) / 100
      : 0;

  return {
    expectedAttendees,
    totalAttended,
    remaining,
    attendancePercentage,
  };
}

/**
 * Get meal breakdown for all attending guests and their accompanying family members.
 * Counts VEG and NON_VEG individually.
 */
export async function getMealStats() {
  const db = getDb();

  const [result] = await db
    .collection(GUESTS_COLLECTION)
    .aggregate([
      { $match: { attending: true } },
      {
        $facet: {
          primaryMeals: [
            {
              $group: {
                _id: { $toUpper: "$mealPreference" },
                count: { $sum: 1 },
              },
            },
          ],
          familyMeals: [
            { $unwind: { path: "$familyMembers", preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: { $toUpper: "$familyMembers.mealPreference" },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ])
    .toArray();

  let vegetarian = 0;
  let nonVegetarian = 0;

  if (result) {
    for (const item of result.primaryMeals || []) {
      if (item._id === "VEG") vegetarian += item.count;
      else if (item._id === "NON_VEG") nonVegetarian += item.count;
    }
    for (const item of result.familyMeals || []) {
      if (item._id === "VEG") vegetarian += item.count;
      else if (item._id === "NON_VEG") nonVegetarian += item.count;
    }
  }

  return {
    vegetarian,
    nonVegetarian,
  };
}

/**
 * Get check-in statistics: total successful check-ins and check-ins today.
 */
export async function getCheckinStats() {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [total, today] = await Promise.all([
    db.collection(CHECKINS_COLLECTION).countDocuments({ result: "SUCCESS" }),
    db.collection(CHECKINS_COLLECTION).countDocuments({
      result: "SUCCESS",
      checkedInAt: { $gte: startOfDay },
    }),
  ]);

  return {
    total,
    today,
  };
}

/**
 * Get time-bucketed check-in trend.
 * Supports grouping by hour or day within a date range.
 *
 * @param {object} params
 * @param {string} [params.from] Start ISO date string
 * @param {string} [params.to] End ISO date string
 * @param {'hour'|'day'} [params.granularity='hour']
 */
export async function getCheckinTrend({ from, to, granularity = "hour" } = {}) {
  const db = getDb();

  const match = { result: "SUCCESS" };

  if (from || to) {
    match.checkedInAt = {};
    if (from) match.checkedInAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      // If it's just YYYY-MM-DD, set to end of day
      if (to.length === 10) {
        toDate.setHours(23, 59, 59, 999);
      }
      match.checkedInAt.$lte = toDate;
    }
  }

  const dateFormat = granularity === "day" ? "%Y-%m-%d" : "%Y-%m-%d %H:00";

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: "$checkedInAt",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        count: 1,
      },
    },
  ];

  const items = await db.collection(CHECKINS_COLLECTION).aggregate(pipeline).toArray();

  return {
    granularity,
    items,
  };
}

/**
 * Get staff check-in statistics (leaderboard).
 * Performs $lookup with users collection to resolve staff names safely.
 */
export async function getStaffCheckinStats() {
  const db = getDb();

  const pipeline = [
    { $match: { result: "SUCCESS", checkedInBy: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: "$checkedInBy",
        checkIns: { $sum: 1 },
        lastCheckedInName: { $last: "$checkedInByName" },
        lastCheckedInEmail: { $last: "$checkedInByEmail" },
      },
    },
    {
      $lookup: {
        from: USERS_COLLECTION,
        localField: "_id",
        foreignField: "firebaseUid",
        as: "userProfile",
      },
    },
    {
      $project: {
        _id: 0,
        staffId: "$_id",
        staffName: {
          $ifNull: [
            { $arrayElemAt: ["$userProfile.name", 0] },
            "$lastCheckedInName",
            "Staff Member",
          ],
        },
        staffEmail: {
          $ifNull: [
            { $arrayElemAt: ["$userProfile.email", 0] },
            "$lastCheckedInEmail",
            "",
          ],
        },
        checkIns: 1,
      },
    },
    { $sort: { checkIns: -1 } },
  ];

  const items = await db.collection(CHECKINS_COLLECTION).aggregate(pipeline).toArray();

  return { items };
}

/**
 * Get recent successful check-ins.
 *
 * @param {number} [limit=10] Max records (capped at 50)
 */
export async function getRecentCheckins(limit = 10) {
  const db = getDb();
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const items = await db
    .collection(CHECKINS_COLLECTION)
    .find({ result: "SUCCESS" })
    .sort({ checkedInAt: -1 })
    .limit(safeLimit)
    .project({
      _id: 1,
      guestId: 1,
      guestName: 1,
      confirmationNumber: 1,
      familyCount: 1,
      mealPreference: 1,
      verificationMethod: 1,
      checkedInByName: 1,
      checkedInAt: 1,
    })
    .toArray();

  return {
    items: items.map((doc) => ({
      id: doc._id.toString(),
      guestId: doc.guestId,
      guestName: doc.guestName,
      confirmationNumber: doc.confirmationNumber || null,
      familyCount: doc.familyCount || 1,
      mealPreference: doc.mealPreference || "VEG",
      verificationMethod: doc.verificationMethod,
      checkedInByName: doc.checkedInByName || "Staff",
      checkedInAt: doc.checkedInAt ? new Date(doc.checkedInAt).toISOString() : null,
    })),
  };
}

export default {
  ensureIndexes,
  getRegistrationStats,
  getAttendanceSummary,
  getMealStats,
  getCheckinStats,
  getCheckinTrend,
  getStaffCheckinStats,
  getRecentCheckins,
};

