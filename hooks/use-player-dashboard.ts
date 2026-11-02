import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getPlayerDashboard } from '@/lib/api/auth';

/**
 * Unified dashboard hook - ONE query key, shared across all components
 * 
 * Replaces:
 * - ["dashboard"] in home/game/raffles
 * - ["dashboard-shell"] in authenticated-shell
 * - Direct getPlayerDashboard() calls in trivia-flow and game-details
 * 
 * After game end or subscription purchase, invalidate with:
 * queryClient.invalidateQueries({ queryKey: ['dashboard'] })
 */
export function usePlayerDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getPlayerDashboard,
    staleTime: 60_000, // Data fresh for 1 minute
    placeholderData: keepPreviousData, // Keep showing old data during refetch
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't hammer API on tab switch
  });
}
