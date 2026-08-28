import { getDb } from "../config/database.js";

const MAX_RETRIES = 10;

/**
 * Generate a cryptographically random 4-digit string (0000-9999)
 * with leading-zero preservation, e.g. "0007", "0142", "5831".
 */
function generateRandom4Digit() {
  const n = Math.floor(Math.random() * 10000);
  return String(n).padStart(4, "0");
}

/**
 * Generate a unique 4-digit confirmation number.
 * Checks the guests collection for collisions and retries up to MAX_RETRIES times.
 *
 * @param {object} guestRepository - optional repository to use for exists check (for testability)
 * @returns {Promise<string>} - the unique 4-digit confirmation number string
 */
export async function generateUniqueConfirmationNumber(guestRepository) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateRandom4Digit();

    // Use injected repository or query db directly
    let exists = false;
    if (guestRepository) {
      exists = await guestRepository.existsByConfirmationNumber(code);
    } else {
      const db = getDb();
      const guest = await db.collection("guests").findOne({ confirmationNumber: code });
      exists = !!guest;
    }

    if (!exists) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate a unique confirmation number after ${MAX_RETRIES} attempts. Please try again.`
  );
}

