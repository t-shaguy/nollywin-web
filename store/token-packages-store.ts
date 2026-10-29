import { create } from "zustand";
import { getCurrentTokenExchangeRate } from "@/lib/api/wallet";

export interface TokenPackage {
  id: string;
  name: string;
  tokens: string; // Calculated token amount
  price: number; // in Naira
  popular?: boolean;
}

interface TokenPackagesState {
  packages: TokenPackage[];
  loading: boolean;
  error: string | null;
  exchangeRate: number | null; // koboPerToken
  setPackages: (packages: TokenPackage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setExchangeRate: (rate: number) => void;
}

// Base package definitions (prices only)
const BASE_PACKAGES = [
  { id: "starter", name: "Starter", price: 100 },
  { id: "standard", name: "Standard", price: 200, popular: true },
  { id: "value", name: "Value", price: 500 },
  { id: "pro", name: "Pro", price: 900 },
];

export const useTokenPackagesStore = create<TokenPackagesState>()((set) => ({
  packages: [],
  loading: false,
  error: null,
  exchangeRate: null,
  
  setPackages: (packages) => set({ packages }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setExchangeRate: (rate) => set({ exchangeRate: rate }),
}));

/**
 * Calculate tokens from price using exchange rate
 * @param priceInNaira - Price in Naira
 * @param koboPerToken - Exchange rate (kobo per token)
 * @returns Token amount as string with proper pluralization
 */
function calculateTokens(priceInNaira: number, koboPerToken: number): string {
  const priceInKobo = priceInNaira * 100;
  const tokens = Math.floor(priceInKobo / koboPerToken);
  return tokens === 1 ? "1 token" : `${tokens} tokens`;
}

/**
 * Fetch exchange rate and update packages with calculated token amounts
 */
export async function fetchTokenPackages() {
  const { setLoading, setError, setPackages, setExchangeRate } = useTokenPackagesStore.getState();
  
  try {
    setLoading(true);
    setError(null);
    
    // Fetch current exchange rate
    const rateData = await getCurrentTokenExchangeRate();
    const { koboPerToken } = rateData;
    
    setExchangeRate(koboPerToken);
    
    // Calculate tokens for each package
    const packagesWithTokens = BASE_PACKAGES.map((pkg) => ({
      ...pkg,
      tokens: calculateTokens(pkg.price, koboPerToken),
    }));
    
    setPackages(packagesWithTokens);
  } catch (err) {
    console.warn("Failed to fetch token packages:", err);
    setError(err instanceof Error ? err.message : "Failed to load packages");
    
    // Fallback: Use default rate of 10,000 kobo per token (₦100 = 1 token)
    const fallbackRate = 10000;
    setExchangeRate(fallbackRate);
    
    const packagesWithTokens = BASE_PACKAGES.map((pkg) => ({
      ...pkg,
      tokens: calculateTokens(pkg.price, fallbackRate),
    }));
    
    setPackages(packagesWithTokens);
  } finally {
    setLoading(false);
  }
}
