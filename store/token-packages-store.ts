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
// Token estimates are approximations; actual tokens granted determined by backend
const STATIC_PACKAGES: TokenPackage[] = [
  { id: "starter", name: "Starter", price: 100, tokensEstimate: "~100 tokens" },
  { id: "standard", name: "Standard", price: 200, popular: true, tokensEstimate: "~200 tokens" },
  { id: "value", name: "Value", price: 500, tokensEstimate: "~500 tokens" },
  { id: "pro", name: "Pro", price: 900, tokensEstimate: "~900 tokens" },
];

export const useTokenPackagesStore = create<TokenPackagesState>()(() => ({
  packages: STATIC_PACKAGES,
  loading: false,
  error: null,
}));
