import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type RaffleDraw } from "@/lib/api/leaderboard";

// V37: Use RaffleDraw type from API directly
export type Raffle = RaffleDraw;

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
 * Fetch active raffle draws from the API (V37)
 * Call this when the raffles/home page is loaded or when data needs to be refreshed
 */
export async function fetchActiveDraws() {
  try {
    const { getActiveDraws } = await import("@/lib/api/leaderboard");
    useRaffleStore.getState().setLoading(true);
    
    const draws = await getActiveDraws();
    
    // Backend returns array directly
    useRaffleStore.getState().setRaffles(draws);
    
    return draws;
  } catch (error) {
    useRaffleStore.getState().setLoading(false);
    console.warn("Failed to fetch active draws:", error);
    throw error;
  }
}
