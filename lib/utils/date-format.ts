/**
 * Shared Date Formatting Utilities
 * 
 * One format everywhere in admin:
 * - Dates: "13 Nov 2026"
 * - Date-times: "13 Nov 2026, 02:00" (24-hour, Africa/Lagos)
 * - Null dates: "—"
 */

const LAGOS_TIMEZONE = "Africa/Lagos";

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
 * Format a date for input[type="date"] (YYYY-MM-DD)
 */
export function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Format a date-time for input[type="datetime-local"] (YYYY-MM-DDTHH:mm)
 */
export function formatDateTimeForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/**
 * Create a date-time string with Lagos offset for API
 * Example: "2026-11-06T14:25+01:00"
 */
export function createLagosDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+01:00`;
}

/**
 * Get start of day in Lagos time (00:00:00)
 */
export function getStartOfDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}T00:00:00+01:00`;
}

/**
 * Get end of day in Lagos time (23:59:59)
 */
export function getEndOfDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}T23:59:59+01:00`;
}

/**
 * Date presets for filters
 */
export function getDatePresets() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  return {
    today: {
      from: getStartOfDay(today),
      to: getEndOfDay(today)
    },
    last7Days: {
      from: getStartOfDay(sevenDaysAgo),
      to: getEndOfDay(today)
    },
    thisMonth: {
      from: getStartOfDay(firstOfMonth),
      to: createLagosDateTime(lastOfMonth)
    }
  };
}
