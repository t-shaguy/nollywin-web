/**
 * Hook to sync wallet balance with the backend
 * Call this in authenticated pages/layouts to keep wallet state up to date
 */

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { fetchWalletBalance } from "@/store/wallet-store";

export function useWalletSync() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Only fetch if user is authenticated (has token)
    if (token && token !== "guest-session-token") {
      fetchWalletBalance().catch((error) => {
        console.error("Failed to sync wallet balance:", error);
        // Silent fail - wallet store will keep its persisted/default values
      });
    }
  }, [token]);
}
