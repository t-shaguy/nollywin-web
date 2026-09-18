import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  player: string;
  points: number;
  prize?: string;
  isCurrentUser?: boolean;
}

interface LeaderboardState {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  monthEndDate: Date;
  isLoading: boolean;
  setLeaderboard: (entries: LeaderboardEntry[], currentUserRank?: number) => void;
  setLoading: (loading: boolean) => void;
}

// Calculate month end (last day of current month)
function getMonthEndDate(): Date {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return lastDay;
}

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set) => ({
      entries: [],
      currentUserRank: null,
      monthEndDate: getMonthEndDate(),
      isLoading: false,

      setLeaderboard: (entries, currentUserRank) => 
        set({ 
          entries, 
          currentUserRank: currentUserRank ?? null,
          isLoading: false 
        }),
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: "leaderboard-storage" }
  )
);

/**
 * Fetch leaderboard data from the API
 * Call this when the leaderboard page is loaded or when data needs to be refreshed
 */
export async function fetchLeaderboard(period: string = "monthly") {
  try {
    const { getLeaderboard } = await import("@/lib/api/leaderboard");
    useLeaderboardStore.getState().setLoading(true);
    
    const response = await getLeaderboard(period);
    
    // Defensive: check if leaderboard exists in response
    if (!response?.leaderboard || !Array.isArray(response.leaderboard)) {
      console.warn("Leaderboard data not available in response");
      useLeaderboardStore.getState().setLeaderboard([], undefined);
      return response;
    }
    
    // Map API response to store format
    const entries: LeaderboardEntry[] = response.leaderboard.map((entry) => ({
      rank: entry.rank,
      playerId: entry.userId,
      player: entry.alias || entry.playerName || `Player ${entry.userId.slice(0, 6)}`,
      points: entry.score,
      prize: undefined, // Prize info might come from a separate field
      isCurrentUser: entry.isCurrentUser,
    }));
    
    useLeaderboardStore.getState().setLeaderboard(entries, response.currentUserRank);
    
    return response;
  } catch (error) {
    useLeaderboardStore.getState().setLoading(false);
    console.error("Failed to fetch leaderboard:", error);
    throw error;
  }
}
