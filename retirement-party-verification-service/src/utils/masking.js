/**
 * Sensitive Data Masking Utility for Safe Structured Logging
 */

/**
 * Mask a phone number leaving only the last 4 digits visible.
 * E.g. "9876543210" -> "******3210"
 *
 * @param {string} phone
 * @returns {string}
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return "****";
  const visible = cleaned.slice(-4);
  const masked = "*".repeat(cleaned.length - 4) + visible;
  return masked;
}

/**
 * Mask confirmation code or ID for secure diagnostics if needed.
 * E.g. "0142" -> "**42"
 *
 * @param {string} code
 * @returns {string}
 */
export function maskConfirmationCode(code) {
  if (!code || typeof code !== "string") return "";
  const cleaned = code.trim();
  if (cleaned.length <= 2) return "**";
  const visible = cleaned.slice(-2);
  return "*".repeat(cleaned.length - 2) + visible;
}

export default {
  maskPhone,
  maskConfirmationCode,
};
