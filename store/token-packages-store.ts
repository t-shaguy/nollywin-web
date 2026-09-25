import { create } from "zustand";

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number; // in Naira
  popular?: boolean;
}

interface TokenPackagesState {
  packages: TokenPackage[];
  loading: boolean;
  error: string | null;
  fetchPackages: () => Promise<void>;
}

// Static Naira amounts for token top-up packages
// Token amounts are calculated dynamically based on backend exchange rate
const NAIRA_AMOUNTS = [
  { id: "starter", name: "Starter", price: 100 },
  { id: "standard", name: "Standard", price: 200, popular: true },
  { id: "value", name: "Value", price: 500 },
  { id: "pro", name: "Pro", price: 900 },
];

export const useTokenPackagesStore = create<TokenPackagesState>()((set, get) => ({
  packages: NAIRA_AMOUNTS.map(pkg => ({ ...pkg, tokens: 0 })), // Default to 0 until fetched
  loading: false,
  error: null,

  fetchPackages: async () => {
    try {
      set({ loading: true, error: null });
      
      // Get current exchange rate from admin endpoint
      const { getCurrentTokenExchangeRate } = await import("@/lib/api/admin");
      const exchangeRate = await getCurrentTokenExchangeRate();
      
      // Calculate real token amounts based on exchange rate
      // koboPerToken = how many kobo buys 1 token
      // So: tokens = (Naira × 100 kobo) ÷ koboPerToken
      const packages = NAIRA_AMOUNTS.map(pkg => ({
        ...pkg,
        tokens: Math.floor((pkg.price * 100) / exchangeRate.koboPerToken),
      }));
      
      set({ packages, loading: false });
    } catch (error) {
      console.error("Failed to fetch token exchange rate:", error);
      set({ 
        error: "Failed to load token prices. Please try again.",
        loading: false,
        // Fallback to default packages with warning tokens=0
        packages: NAIRA_AMOUNTS.map(pkg => ({ ...pkg, tokens: 0 }))
      });
    }
  },
}));
