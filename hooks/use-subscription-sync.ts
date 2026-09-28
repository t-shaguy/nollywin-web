/**
 * Hook to sync subscription status with the backend
 * Call this in authenticated pages/layouts to keep subscription state up to date
 */

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { fetchSubscriptionStatus } from "@/store/subscription-store";
import { useToast } from "@/components/ui/toast";

export function useSubscriptionSync() {
  const token = useAuthStore((s) => s.token);
  const { showToast } = useToast();

  const retryFetch = () => {
    fetchSubscriptionStatus().catch((error) => {
      console.error("Failed to sync subscription status (retry):", error);
      // Don't show toast again on retry failure to avoid spam
    });
  };

  useEffect(() => {
    // Only fetch if user is authenticated (has token)
    if (token && token !== "guest-session-token") {
      fetchSubscriptionStatus().catch((error: any) => {
        console.error("Failed to sync subscription status:", error);
        // Don't show toast for 401 errors (user will be logged out automatically)
        if (error?.status !== 401) {
          showToast("Couldn't refresh subscription status", {
            label: "Retry",
            onClick: retryFetch,
          });
        }
      });
    }
  }, [token]);
}
