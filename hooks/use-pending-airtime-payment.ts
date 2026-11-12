import { useState, useEffect } from "react";
import { usePlayerDashboard } from "./use-player-dashboard";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

interface PendingPayment {
  transactionId: string;
  tid?: number;
  packageName: string;
  startedAt: string; // ISO 8601
  baseline: {
    expiresAt: string | null;
    tokensLeft: number | null;
    packageName: string | null;
  };
}

const STORAGE_KEY = "nollywin:airtime-pending";
const MAX_PENDING_MINUTES = 30;

/**
 * Hook to check for pending airtime payment that hasn't timed out yet
 * Tracks baseline from dashboard at payment start to detect confirmation
 * 
 * Payment is confirmed when:
 * - subscription.expiresAt is later than baseline's expiresAt
 * - tokensLeft rose above baseline (including from 0 to > 0)
 */
export function usePendingAirtimePayment() {
  const { data: dashboard } = usePlayerDashboard();
  const { showSuccessToast } = useToast();
  const queryClient = useQueryClient();
  
  // Use null initially to avoid hydration mismatch, then check storage on mount
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from sessionStorage only on client side after mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsHydrated(true);
        return;
      }

      const parsed: PendingPayment = JSON.parse(stored);
      
      // Validate structure
      if (!parsed.baseline || typeof parsed.baseline !== 'object') {
        sessionStorage.removeItem(STORAGE_KEY);
        setIsHydrated(true);
        return;
      }
      
      const startedAt = new Date(parsed.startedAt);
      const now = new Date();
      const ageMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);

      // Check if payment is still pending (< 30 minutes old)
      if (ageMinutes < MAX_PENDING_MINUTES) {
        setPendingPayment(parsed);
      } else {
        // Expired, clean up
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Invalid data, clean up
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const clearPendingPayment = () => {
    if (typeof window === "undefined") return;
    
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setPendingPayment(null);
    } catch {
      // Ignore
    }
  };

  // Check for payment confirmation when dashboard updates
  useEffect(() => {
    if (!pendingPayment || !dashboard) return;

    const baseline = pendingPayment.baseline;
    
    // Validate baseline structure
    if (!baseline || typeof baseline !== 'object') {
      clearPendingPayment();
      return;
    }
    
    // Check if subscription expiresAt is later than baseline
    const currentExpiresAt = dashboard.subscription?.expiresAt;
    const baselineExpiresAt = baseline.expiresAt;
    
    let confirmed = false;
    
    if (currentExpiresAt && baselineExpiresAt) {
      const current = new Date(currentExpiresAt).getTime();
      const base = new Date(baselineExpiresAt).getTime();
      if (current > base) {
        confirmed = true;
      }
    } else if (currentExpiresAt && !baselineExpiresAt) {
      // Had no plan, now has one
      confirmed = true;
    }
    
    // Check if tokensLeft rose above baseline
    const currentTokens = dashboard.tokensLeft;
    const baselineTokens = baseline.tokensLeft;
    
    if (currentTokens !== null && baselineTokens !== null) {
      if (currentTokens > baselineTokens) {
        confirmed = true;
      }
    } else if (currentTokens !== null && currentTokens > 0 && baselineTokens === 0) {
      // Had 0 tokens, now has more
      confirmed = true;
    } else if (currentTokens === null && baselineTokens !== null) {
      // Upgraded to unlimited
      confirmed = true;
    }
    
    if (confirmed) {
      // Clear pending payment and show success (use setTimeout to avoid cascading renders)
      setTimeout(() => {
        clearPendingPayment();
        showSuccessToast("Plan activated");
      }, 0);
    }
  }, [dashboard, pendingPayment, showSuccessToast]);

  // Auto-refresh on visibility change (bounded - only once per visibility change)
  useEffect(() => {
    if (!pendingPayment || typeof window === "undefined") return;
    
    let hasRefreshed = false;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !hasRefreshed) {
        hasRefreshed = true;
        // Trigger dashboard refetch when tab becomes visible
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingPayment, queryClient]);

  return {
    pendingPayment,
    hasPendingPayment: isHydrated && !!pendingPayment,
    clearPendingPayment,
  };
}
