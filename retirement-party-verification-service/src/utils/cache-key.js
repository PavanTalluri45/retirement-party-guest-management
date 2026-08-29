/**
 * Cache Key Management & Identifier Normalization Module
 *
 * Algorithm / Complexity:
 * - Normalization: O(L) where L is string length (constant-sized <= 20 chars -> O(1))
 * - Key Generation: O(1) string interpolation
 * - Space Complexity: O(1)
 */

export const CACHE_VERSION = "v1";
export const CACHE_NAMESPACE = "verification";

/**
 * Normalize phone number by trimming and extracting digits.
 * E.g., " 9876543210 " -> "9876543210"
 *
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhone(phone) {
  if (typeof phone !== "string") {
    throw new TypeError("Phone number must be a string");
  }
  return phone.trim().replace(/\D/g, "");
}

/**
 * Normalize confirmation number.
 * CRITICAL RULE: Preserves leading zeroes as a strict string (e.g. "0142" remains "0142").
 * Never convert confirmation numbers to integers.
 *
 * @param {string} confirmationNumber
 * @returns {string}
 */
export function normalizeConfirmationNumber(confirmationNumber) {
  if (typeof confirmationNumber !== "string") {
    throw new TypeError("Confirmation number must be a string");
  }
  const normalized = confirmationNumber.trim();
  return normalized;
}

/**
 * Generate deterministic cache key for phone lookup.
 * Example: verification:v1:guest:phone:9876543210
 *
 * @param {string} phone
 * @returns {string}
 */
export function buildPhoneGuestKey(phone) {
  const normalized = normalizePhone(phone);
  return `${CACHE_NAMESPACE}:${CACHE_VERSION}:guest:phone:${normalized}`;
}

/**
 * Generate deterministic cache key for confirmation number lookup.
 * Example: verification:v1:guest:confirmation:0142
 *
 * @param {string} confirmationNumber
 * @returns {string}
 */
export function buildConfirmationGuestKey(confirmationNumber) {
  const normalized = normalizeConfirmationNumber(confirmationNumber);
  return `${CACHE_NAMESPACE}:${CACHE_VERSION}:guest:confirmation:${normalized}`;
}

export default {
  CACHE_VERSION,
  CACHE_NAMESPACE,
  normalizePhone,
  normalizeConfirmationNumber,
  buildPhoneGuestKey,
  buildConfirmationGuestKey,
};
