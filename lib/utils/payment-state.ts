/**
 * Payment state management utilities
 * Tracks when a user starts a payment to handle the "payment pending" state properly
 */

const STORAGE_KEY = "nollywin:payment-started";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface PaymentStartedRecord {
  packageName: string;
  startedAt: number; // Date.now() timestamp
  reference?: string; // Paystack reference if available
}

/**
 * Save a payment-started record to localStorage
 */
export function savePaymentStarted(data: PaymentStartedRecord): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("[Payment State] Failed to save:", error);
  }
}

/**
 * Get the saved payment-started record, or null if expired/missing
 */
export function getPaymentStarted(): PaymentStartedRecord | null {
  if (typeof window === "undefined") return null;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    const record = JSON.parse(raw) as PaymentStartedRecord;
    
    // Check if expired (older than 24 hours)
    const now = Date.now();
    if (now - record.startedAt > EXPIRY_MS) {
      clearPaymentStarted();
      return null;
    }
    
    return record;
  } catch (error) {
    console.warn("[Payment State] Failed to read:", error);
    return null;
  }
}

/**
 * Clear the payment-started record
 */
export function clearPaymentStarted(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("[Payment State] Failed to clear:", error);
  }
}

/**
 * Format time ago from timestamp (minutes or hours)
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  
  if (diffMinutes < 1) {
    return "just now";
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
}
