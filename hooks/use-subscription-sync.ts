/**
 * Hook to sync subscription status with the backend
 * Call this in authenticated pages/layouts to keep subscription state up to date
 */

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { fetchSubscriptionStatus } from "@/store/subscription-store";

export function useSubscriptionSync() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Only fetch if user is authenticated (has token)
    if (token && token !== "guest-session-token") {
      fetchSubscriptionStatus().catch((error) => {
        console.error("Failed to sync subscription status:", error);
        // Silent fail - subscription store will keep its persisted/default values
      });
    }
  }, [token]);
}
