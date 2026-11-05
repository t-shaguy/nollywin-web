import { useState } from "react";

interface PendingPayment {
  transactionId: string;
  tid?: number;
  packageName: string;
  startedAt: string; // ISO 8601
}

const STORAGE_KEY = "nollywin:airtime-pending";
const MAX_PENDING_MINUTES = 30;

/**
 * Hook to check for pending airtime payment that hasn't timed out yet
 * Returns the pending payment info if exists and is still valid (<30 min old)
 */
export function usePendingAirtimePayment() {
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(() => {
    // Skip on server-side render
    if (typeof window === "undefined") return null;
    
    // Initialize state from sessionStorage on mount
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: PendingPayment = JSON.parse(stored);
      const startedAt = new Date(parsed.startedAt);
      const now = new Date();
      const ageMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);

      // Check if payment is still pending (< 30 minutes old)
      if (ageMinutes < MAX_PENDING_MINUTES) {
        return parsed;
      } else {
        // Expired, clean up
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
    } catch {
      // Invalid data, clean up
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const clearPendingPayment = () => {
    if (typeof window === "undefined") return;
    
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setPendingPayment(null);
    } catch {
      // Ignore
    }
  };

  return {
    pendingPayment,
    hasPendingPayment: !!pendingPayment,
    clearPendingPayment,
  };
}
