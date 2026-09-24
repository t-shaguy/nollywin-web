/**
 * Subscription Packages Store
 * 
 * Fetches real packages from GET /api/v1/subscriptions/packages
 * Replaces hardcoded fake package list
 */

import { create } from "zustand";
import { getAvailablePackages, type SubscriptionPackage } from "@/lib/api/subscriptions";

interface PackagesState {
  packages: SubscriptionPackage[];
  loading: boolean;
  error: string | null;
  fetchPackages: () => Promise<void>;
}

export const usePackagesStore = create<PackagesState>()((set) => ({
  packages: [],
  loading: false,
  error: null,
  
  fetchPackages: async () => {
    set({ loading: true, error: null });
    try {
      const packages = await getAvailablePackages();
      set({ packages, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load packages", loading: false });
    }
  },
}));

// Auto-fetch packages on store creation
usePackagesStore.getState().fetchPackages();
