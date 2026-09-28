/**
 * Hook to sync wallet balance with the backend
 * Call this in authenticated pages/layouts to keep wallet state up to date
 */

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { fetchWalletBalance } from "@/store/wallet-store";
import { useToast } from "@/components/ui/toast";

export function useWalletSync() {
  const token = useAuthStore((s) => s.token);
  const { showToast } = useToast();

  const retryFetch = () => {
    fetchWalletBalance().catch((error) => {
      console.error("Failed to sync wallet balance (retry):", error);
      // Don't show toast again on retry failure to avoid spam
    });
  };

  useEffect(() => {
    console.log("[CANARY] useWalletSync effect ran, token:", token);
    // Only fetch if user is authenticated (has token)
    if (token && token !== "guest-session-token") {
      fetchWalletBalance().catch((error: any) => {
        console.error("Failed to sync wallet balance:", error);
        // Don't show toast for 401 errors (user will be logged out automatically)
        if (error?.status !== 401) {
          showToast("Couldn't refresh your balance", {
            label: "Retry",
            onClick: retryFetch,
          });
        }
      });
    }
  }, [token]);
}
