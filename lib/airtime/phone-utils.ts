/**
 * Phone number normalization and validation utilities
 * All Nigerian numbers are normalized to +234 format (14 chars)
 */

/**
 * Normalize Nigerian phone number to +234 format
 * Accepts: 08036533888, 2348036533888, +2348036533888, 0803 653 3888
 * Returns: +2348036533888 (14 chars) or null if invalid
 */
export function normalizeNigerianPhone(input: string): string | null {
  // Remove all non-digit characters except leading +
  const hasPlus = input.startsWith("+");
  const digits = input.replace(/\D/g, "");
  
  // Case 1: +234xxxxxxxxxx (already formatted)
  if (hasPlus && digits.startsWith("234") && digits.length === 13) {
    return `+${digits}`;
  }
  
  // Case 2: 234xxxxxxxxxx (missing +)
  if (digits.startsWith("234") && digits.length === 13) {
    return `+${digits}`;
  }
  
  // Case 3: 0xxxxxxxxxx (local format, 11 digits)
  if (digits.startsWith("0") && digits.length === 11) {
    // Remove leading 0, add +234
    return `+234${digits.substring(1)}`;
  }
  
  // Case 4: xxxxxxxxxx (10 digits, missing 0 and country code)
  if (digits.length === 10) {
    return `+234${digits}`;
  }
  
  // Invalid format
  return null;
}

/**
 * Validate Nigerian phone number
 * Returns error message or null if valid
 */
export function validateNigerianPhone(input: string): string | null {
  if (!input || input.trim().length === 0) {
    return "Phone number is required";
  }
  
  const normalized = normalizeNigerianPhone(input);
  if (!normalized) {
    return "Enter a valid Nigerian phone number";
  }
  
  // Check if it's a valid Nigerian mobile prefix
  // Valid prefixes: 0803, 0806, 0810, 0813, 0814, 0816, 0703, 0706, 0803, 0805, 0807, 0808, 0809, 0811, 0812, 0815, 0817, 0818, 0902, 0903, 0904, 0905, 0906, 0907, 0908, 0909, 0912, 0913, 0914, 0915, 0916, 0917, 0918
  // We check the 4th and 5th digits (after +234)
  const afterCode = normalized.substring(4); // Remove +234
  const prefix = afterCode.substring(0, 2); // First 2 digits after country code
  
  const validPrefixes = [
    "70", "80", "81", "90", "91", // Covers 070x, 080x, 081x, 090x, 091x
  ];
  
  const isValid = validPrefixes.some(p => prefix.startsWith(p));
  if (!isValid) {
    return "Enter a valid Nigerian phone number";
  }
  
  return null;
}

/**
 * Format phone number for display with spaces
 * +2348036533888 → +234 803 653 3888
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizeNigerianPhone(phone);
  if (!normalized) return phone;
  
  // +234 803 653 3888
  return `${normalized.substring(0, 4)} ${normalized.substring(4, 7)} ${normalized.substring(7, 10)} ${normalized.substring(10)}`;
}

/**
 * Mask phone number for logging (hide middle digits)
 * +2348036533888 → +23480****888
 */
export function maskPhone(phone: string): string {
  if (phone.length < 10) return "***";
  
  const start = phone.substring(0, 6);
  const end = phone.substring(phone.length - 3);
  return `${start}****${end}`;
}
