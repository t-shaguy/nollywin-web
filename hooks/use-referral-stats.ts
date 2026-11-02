import { useQuery } from "@tanstack/react-query";
import { getReferralStats } from "@/lib/api/referral";

/**
 * React Query hook for fetching user's referral statistics
 * Cached for 5 minutes to avoid redundant fetches
 */
export function useReferralStats() {
  return useQuery({
    queryKey: ["referral", "stats"],
    queryFn: getReferralStats,
    staleTime: 5 * 60_000, // 5 minutes
    retry: 1,
  });
}
