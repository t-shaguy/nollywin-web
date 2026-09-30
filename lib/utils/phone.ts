/**
 * Phone number utilities for Nigerian numbers
 */

/**
 * Convert local Nigerian phone format to international format
 * 
 * Examples:
 * - "08012345678" → "+2348012345678"
 * - "2348012345678" → "+2348012345678"
 * - "+2348012345678" → "+2348012345678"
 * - "8012345678" → "+2348012345678"
 * 
 * @param input - Phone number in any format
 * @returns Phone number in international format (+234XXXXXXXXXX)
 */
export function toInternationalPhone(input: string): string {
  const digits = input.trim().replace(/\D/g, ""); // strip anything non-numeric
  if (digits.startsWith("234")) return `+${digits}`;      // already has country code
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`; // strip leading 0, add +234
  return `+234${digits}`; // no leading 0, just prepend
}
