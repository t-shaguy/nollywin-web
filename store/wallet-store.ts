import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  tokens: number;
  points: number;
  addTokens: (amount: number) => void;
  deductTokens: (amount: number) => boolean; // returns false if insufficient
  addPoints: (amount: number) => void;
  resetWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // TODO: replace with GET /users/wallet once the backend is live.
      tokens: 20, // Start with 20 tokens for testing
      points: 1200, // Start with 1200 points (matching leaderboard rank 8)

      addTokens: (amount) =>
        set((state) => ({
          tokens: state.tokens + amount,
        })),

      deductTokens: (amount) => {
        const currentTokens = get().tokens;
        if (currentTokens < amount) {
          return false; // Insufficient tokens
        }
        set({ tokens: currentTokens - amount });
        return true; // Success
      },

      addPoints: (amount) =>
        set((state) => {
          const newPoints = state.points + amount;
          // TODO: When backend exists, POST /leaderboard/update-score
          // For now, the leaderboard will update based on localStorage sync
          return { points: newPoints };
        }),

      resetWallet: () =>
        set({
          tokens: 20,
          points: 1200,
        }),
    }),
    { name: "nollywin-wallet" }
  )
);
