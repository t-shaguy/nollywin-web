import { create } from "zustand";
import { persist } from "zustand/middleware";

// VERIFIED: Wallet only tracks tokenBalance. Points come from profile endpoint.
interface WalletState {
  tokenBalance: number;
  isLoading: boolean;
  addTokens: (amount: number) => void;
  deductTokens: (amount: number) => boolean; // returns false if insufficient
  setBalance: (tokenBalance: number) => void;
  setLoading: (loading: boolean) => void;
  resetWallet: () => void;
  // Legacy getter for backward compatibility during migration
  get tokens(): number;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial balance - will be replaced by API call on mount/login
      tokenBalance: 0,
      isLoading: false,

      // Legacy getter for backward compatibility
      get tokens() {
        return get().tokenBalance;
      },

      setBalance: (tokenBalance) =>
        set({
          tokenBalance,
          isLoading: false,
        }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      addTokens: (amount) =>
        set((state) => ({
          tokenBalance: state.tokenBalance + amount,
        })),

      deductTokens: (amount) => {
        const currentBalance = get().tokenBalance;
        if (currentBalance < amount) {
          return false; // Insufficient tokens
        }
        set({ tokenBalance: currentBalance - amount });
        return true; // Success
      },

      resetWallet: () =>
        set({
          tokenBalance: 0,
          isLoading: false,
        }),
    }),
    { name: "nollywin-wallet" }
  )
);

/**
 * Fetch wallet balance from the API
 * Call this on login or when the wallet needs to be refreshed
 * 
 * VERIFIED: GET /api/v1/wallet returns { authUserId, tokenBalance }
 */
export async function fetchWalletBalance() {
  try {
    const { getBalance } = await import("@/lib/api/wallet");
    useWalletStore.getState().setLoading(true);
    const balance = await getBalance();
    useWalletStore.getState().setBalance(balance.tokenBalance);
    return balance;
  } catch (error) {
    useWalletStore.getState().setLoading(false);
    console.error("Failed to fetch wallet balance:", error);
    throw error;
  }
}
