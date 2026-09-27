import { create } from "zustand";

export interface TokenPackage {
  id: string;
  name: string;
  tokensEstimate?: string; // Estimate instead of exact number
  price: number; // in Naira
  popular?: boolean;
}

interface TokenPackagesState {
  packages: TokenPackage[];
  loading: boolean;
  error: string | null;
}

// Static token packages - DO NOT call /admin/ endpoints from player-facing screens
// Exchange rate confirmed from live notification data: ₦100 = 1 token exactly
// (verified: ₦500→5 tokens, ₦200→2 tokens, ₦900→9 tokens)
const STATIC_PACKAGES: TokenPackage[] = [
  { id: "starter", name: "Starter", price: 100, tokensEstimate: "~1 token" },
  { id: "standard", name: "Standard", price: 200, popular: true, tokensEstimate: "~2 tokens" },
  { id: "value", name: "Value", price: 500, tokensEstimate: "~5 tokens" },
  { id: "pro", name: "Pro", price: 900, tokensEstimate: "~9 tokens" },
];

export const useTokenPackagesStore = create<TokenPackagesState>()(() => ({
  packages: STATIC_PACKAGES,
  loading: false,
  error: null,
}));
