import { create } from "zustand";
import { persist } from "zustand/middleware";

// VERIFIED: Backend returns this exact shape for active draws
export interface Raffle {
  id: string;
  prizeName: string;
  ticketCostTokens: number;
  scheduleLabel: string;
  maxWinners: number;
  status: "ACTIVE" | "UPCOMING" | "COMPLETED" | "CANCELLED";
  entryCount: number;
  winnersSelected: boolean;
  userTicketCount?: number; // Added by frontend after purchase
}

interface RaffleState {
  raffles: Raffle[];
  isLoading: boolean;
  setRaffles: (raffles: Raffle[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useRaffleStore = create<RaffleState>()(
  persist(
    (set) => ({
      raffles: [],
      isLoading: false,

      setRaffles: (raffles) => set({ raffles, isLoading: false }),
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: "raffle-storage" }
  )
);

/**
 * Fetch active raffle draws from the API
 * Call this when the raffles/home page is loaded or when data needs to be refreshed
 * 
 * VERIFIED: GET /api/v1/rewards/draws/active returns array of RaffleDraw
 */
export async function fetchActiveDraws() {
  try {
    const { getActiveDraws } = await import("@/lib/api/leaderboard");
    useRaffleStore.getState().setLoading(true);
    
    const draws = await getActiveDraws();
    
    // Backend returns array directly - use as-is
    useRaffleStore.getState().setRaffles(draws);
    
    return draws;
  } catch (error) {
    useRaffleStore.getState().setLoading(false);
    console.warn("Failed to fetch active draws:", error);
    throw error;
  }
}
