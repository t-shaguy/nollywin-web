import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";

export interface LeaderboardEntry {
  rank: number;
  playerId: string; // authUserId from API
  player: string; // displayName from API
  points: number;
  prizeAmount: number; // Cash prize in Naira
  isCurrentUser: boolean; // Computed client-side
}

interface LeaderboardState {
  entries: LeaderboardEntry[];
  periodEndsAt: Date | null; // From API periodEndsAt field
  isLoading: boolean;
  setLeaderboard: (entries: LeaderboardEntry[], periodEndsAt: Date) => void;
  setLoading: (loading: boolean) => void;
}

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set) => ({
      entries: [],
      periodEndsAt: null,
      isLoading: false,

      setLeaderboard: (entries, periodEndsAt) => 
        set({ 
          entries, 
          periodEndsAt,
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
 * 
 * VERIFIED API RESPONSE:
 * {
 *   "periodEndsAt": "2026-10-01T00:00:00Z",
 *   "entries": [
 *     { "rank": 1, "authUserId": "...", "displayName": "Khalid1234", "points": 1100, "prizeAmount": 20000.00 }
 *   ]
 * }
 */
export async function fetchLeaderboard(period: string = "monthly") {
  try {
    const { getLeaderboard } = await import("@/lib/api/leaderboard");
    useLeaderboardStore.getState().setLoading(true);
    
    const response = await getLeaderboard(period);
    
    // Defensive: check if entries exists in response
    if (!response?.entries || !Array.isArray(response.entries)) {
      console.warn("Leaderboard entries not available in response");
      useLeaderboardStore.getState().setLeaderboard([], new Date());
      return response;
    }
    
    // Get current user ID from auth store
    const currentUserId = useAuthStore.getState().user?.email || null; // Use email as unique identifier
    
    // Map API response to store format
    const entries: LeaderboardEntry[] = response.entries.map((entry) => ({
      rank: entry.rank,
      playerId: entry.authUserId,
      player: entry.displayName,
      points: entry.points,
      prizeAmount: entry.prizeAmount,
      isCurrentUser: currentUserId ? entry.authUserId === currentUserId : false,
    }));
    
    // Parse periodEndsAt from API
    const periodEndsAt = new Date(response.periodEndsAt);
    
    useLeaderboardStore.getState().setLeaderboard(entries, periodEndsAt);
    
    return response;
  } catch (error) {
    useLeaderboardStore.getState().setLoading(false);
    console.error("Failed to fetch leaderboard:", error);
    throw error;
  }
}
