import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlanId = "daily" | "weekly" | "monthly";

export interface Package {
  id: PlanId;
  name: string;
  price: number; // in Naira
  duration: string;
  attempts: string;
  active: boolean;
  bestValue?: boolean;
  mostPopular?: boolean; // Alias for bestValue for backward compatibility
}

interface PackagesState {
  packages: Package[];
  updatePackage: (id: PlanId, patch: Partial<Package>) => void;
  addPackage: (pkg: Package) => void;
}

export const usePackagesStore = create<PackagesState>()(
  persist(
    (set) => ({
      packages: [
        { id: "daily", name: "Daily", price: 100, duration: "per day", attempts: "1 attempt / day", active: true },
        { id: "weekly", name: "Weekly", price: 200, duration: "per week", attempts: "3 attempts / week", active: true },
        { id: "monthly", name: "Monthly", price: 500, duration: "per month", attempts: "7 attempts / month", active: true, bestValue: true },
      ],
      updatePackage: (id, patch) =>
        set((state) => ({
          packages: state.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      addPackage: (pkg) =>
        set((state) => ({
          packages: [...state.packages, pkg],
        })),
    }),
    { name: "packages-storage" }
  )
);
