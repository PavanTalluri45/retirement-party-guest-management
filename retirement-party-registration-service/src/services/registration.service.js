import * as guestRepository from "../repositories/guest.repository.js";
import { generateUniqueConfirmationNumber } from "../utils/confirmation-number.js";
import { RegistrationSchema } from "../validators/registration.validator.js";

/**
 * Register a new guest.
 * - Validates input with Zod
 * - Checks for duplicate phone (409)
 * - Generates unique 4-digit confirmation number for attending guests
 * - Persists guest document to MongoDB
 *
 * @param {object} rawBody - raw request body from Express
 * @returns {Promise<object>} - the created guest document (formatted)
 * @throws {ValidationError | DuplicatePhoneError | Error}
 */
export async function registerGuest(rawBody) {
  // 1. Validate
  const parsed = RegistrationSchema.safeParse(rawBody);
  if (!parsed.success) {
    const err = new Error("Validation failed");
    err.type = "VALIDATION_ERROR";
    err.errors = parsed.error.issues || parsed.error.errors;
    throw err;
  }

  const { name, phone, attending, familyCount, mealPreference, familyMembers } = parsed.data;

  // 2. Check duplicate phone
  const existing = await guestRepository.findByPhone(phone);
  if (existing) {
    const err = new Error("This phone number has already been registered.");
    err.type = "DUPLICATE_PHONE";
    throw err;
  }

  // 3. Build guest document
  let confirmationNumber = undefined;
  let guestDoc;

  if (attending) {
    // Generate unique confirmation number
    confirmationNumber = await generateUniqueConfirmationNumber(guestRepository);

    guestDoc = {
      name,
      phone,
      attending: true,
      familyCount,
      mealPreference,
      familyMembers: familyMembers ?? [],
      confirmationNumber,
    };
  } else {
    guestDoc = {
      name,
      phone,
      attending: false,
      familyCount: 0,
      mealPreference: null,
      familyMembers: [],
      confirmationNumber: null,
    };
  }

  // 4. Insert into MongoDB
  const inserted = await guestRepository.insertGuest(guestDoc);

  // 5. Format and return
  return formatGuest(inserted);
}

/**
 * Find an attending guest by their 4-digit confirmation number.
 *
 * @param {string} confirmationNumber
 * @returns {Promise<object>} - formatted guest
 * @throws {NotFoundError}
 */
export async function getGuestByConfirmationNumber(confirmationNumber) {
  const guest = await guestRepository.findByConfirmationNumber(confirmationNumber);
  if (!guest) {
    const err = new Error(`No guest found with confirmation number: ${confirmationNumber}`);
    err.type = "NOT_FOUND";
    throw err;
  }
  return formatGuest(guest);
}

/**
 * Find a guest by their MongoDB ObjectId.
 *
 * @param {string} id
 * @returns {Promise<object>} - formatted guest
 * @throws {NotFoundError}
 */
export async function getGuestById(id) {
  const guest = await guestRepository.findById(id);
  if (!guest) {
    const err = new Error(`No guest found with id: ${id}`);
    err.type = "NOT_FOUND";
    throw err;
  }
  return formatGuest(guest);
}

/**
 * Format a raw MongoDB document for API response.
 * Converts _id to id string, removes internal fields.
 */
function formatGuest(doc) {
  const { _id, ...rest } = doc;
  const formatted = {
    id: _id.toString(),
    ...rest,
  };

  // Remove null confirmationNumber from non-attending responses
  if (formatted.confirmationNumber === null) {
    delete formatted.confirmationNumber;
  }

  return formatted;
}

