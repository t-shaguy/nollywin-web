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
}

// Static token top-up packages (not subscription plans)
// These are one-off purchases that add tokens to the wallet
export const useTokenPackagesStore = create<TokenPackagesState>()(() => ({
  packages: [
    { id: "starter", name: "Starter", tokens: 5, price: 100 },
    { id: "standard", name: "Standard", tokens: 10, price: 200, popular: true },
    { id: "value", name: "Value", tokens: 25, price: 500 },
    { id: "pro", name: "Pro", tokens: 50, price: 900 },
  ],
}));
