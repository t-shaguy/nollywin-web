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
  updateRaffleTickets: (raffleId: string, entryCount: number, userTicketCount: number) => void;
}

export const useRaffleStore = create<RaffleState>()(
  persist(
    (set) => ({
      raffles: [],
      isLoading: false,

      setRaffles: (raffles) => set({ raffles, isLoading: false }),
      
      setLoading: (loading) => set({ isLoading: loading }),

      updateRaffleTickets: (raffleId, entryCount, userTicketCount) =>
        set((state) => ({
          raffles: state.raffles.map((r) =>
            r.id === raffleId
              ? { ...r, entryCount, userTicketCount }
              : r
          ),
        })),
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
    throw error;
  }
}

/**
 * Purchase a raffle ticket
 * @param raffleId - The raffle draw ID
 * @param quantity - Number of tickets to purchase (default 1)
 */
export async function purchaseRaffleTicket(raffleId: string, quantity: number = 1) {
  try {
    const { buyTicket } = await import("@/lib/api/leaderboard");
    const response = await buyTicket(raffleId, { quantity });
    
    // Update local state with new ticket counts
    const state = useRaffleStore.getState();
    const raffle = state.raffles.find((r) => r.id === raffleId);
    
    if (raffle) {
      useRaffleStore.getState().updateRaffleTickets(
        raffleId,
        raffle.entryCount + quantity,
        (raffle.userTicketCount || 0) + quantity
      );
    }
    
    // Refresh wallet balance (tokens were deducted)
    const { fetchWalletBalance } = await import("@/store/wallet-store");
    fetchWalletBalance().catch(console.error);
    
    return response;
  } catch (error) {
    throw error;
  }
}
