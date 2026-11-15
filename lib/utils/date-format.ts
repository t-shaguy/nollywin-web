/**
 * Shared Date Formatting Utilities
 * 
 * One format everywhere in admin:
 * - Dates: "13 Nov 2026"
 * - Date-times: "13 Nov 2026, 02:00" (24-hour, Africa/Lagos)
 * - Null dates: "—"
 * 
 * API Date Conversion:
 * - Lagos has NO daylight saving (always UTC+1)
 * - Convert Lagos wall-clock time to UTC for API
 * - Never send timezone offsets (+01:00) - use Z format only
 */

const LAGOS_TIMEZONE = "Africa/Lagos";
const LAGOS_UTC_OFFSET_HOURS = 1; // Lagos is always UTC+1

/**
 * Format a date string as "13 Nov 2026"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: LAGOS_TIMEZONE,
    }).format(date);
  } catch {
    return "—";
  }
}

/**
 * Format a date-time string as "13 Nov 2026, 02:00" (24-hour)
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: LAGOS_TIMEZONE,
    }).format(date);
  } catch {
    return "—";
  }
}

/**
 * Convert Lagos wall-clock time to UTC ISO 8601 string with Z suffix
 * 
 * Lagos has no daylight saving, so UTC = Lagos time minus 1 hour.
 * 
 * Examples:
 * - Lagos 2026-11-06 00:00:00 → 2026-11-05T23:00:00Z
 * - Lagos 2026-11-13 23:59:59 → 2026-11-13T22:59:59Z
 * 
 * @param year Lagos year
 * @param month Lagos month (1-12)
 * @param day Lagos day (1-31)
 * @param hour Lagos hour (0-23)
 * @param minute Lagos minute (0-59)
 * @param second Lagos second (0-59)
 * @returns UTC ISO 8601 string with Z suffix (e.g., "2026-11-05T23:00:00Z")
 */
export function lagosToUtcISO(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): string {
  // Create UTC Date from Lagos wall-clock values
  // Date.UTC uses 0-indexed months
  const lagosUtcTimestamp = Date.UTC(year, month - 1, day, hour, minute, second);
  
  // Subtract 1 hour to convert from Lagos (UTC+1) to UTC
  const utcTimestamp = lagosUtcTimestamp - (LAGOS_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const utcDate = new Date(utcTimestamp);
  
  // Format as ISO 8601 with Z suffix (without milliseconds)
  return utcDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Get start of day in Lagos time, converted to UTC ISO 8601 with Z suffix
 * 
 * @param date Date object (any timezone, we only use year/month/day)
 * @returns UTC ISO string for Lagos 00:00:00 (e.g., "2026-11-05T23:00:00Z")
 */
export function getStartOfDayUTC(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return lagosToUtcISO(year, month, day, 0, 0, 0);
}

/**
 * Get end of day in Lagos time, converted to UTC ISO 8601 with Z suffix
 * 
 * @param date Date object (any timezone, we only use year/month/day)
 * @returns UTC ISO string for Lagos 23:59:59 (e.g., "2026-11-13T22:59:59Z")
 */
export function getEndOfDayUTC(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return lagosToUtcISO(year, month, day, 23, 59, 59);
}

/**
 * Date presets for filters
 * All times converted to UTC ISO 8601 with Z suffix
 */
export function getDatePresets() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Last 7 days = today plus previous 6 days (7 total)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    today: {
      from: getStartOfDayUTC(today),
      to: getEndOfDayUTC(today)
    },
    last7Days: {
      from: getStartOfDayUTC(sevenDaysAgo),
      to: getEndOfDayUTC(today)
    },
    thisMonth: {
      from: getStartOfDayUTC(firstOfMonth),
      to: getEndOfDayUTC(lastOfMonth)
    },
    allTime: {
      from: undefined,
      to: undefined
    }
  };
}
