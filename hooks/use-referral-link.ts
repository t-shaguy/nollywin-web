import { useQuery } from "@tanstack/react-query";
import { getReferralLink } from "@/lib/api/referral";

/**
 * React Query hook for fetching user's referral link
 * Cached for 5 minutes to avoid redundant fetches
 */
export function useReferralLink() {
  return useQuery({
    queryKey: ["referral", "link"],
    queryFn: getReferralLink,
    staleTime: 5 * 60_000, // 5 minutes
    retry: 1,
  });
}
