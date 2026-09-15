import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminAuthState {
  session: { token: string; admin: { email: string } } | null;
  setSession: (token: string, admin: { email: string }) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (token, admin) => set({ session: { token, admin } }),
      logout: () => set({ session: null }),
    }),
    { name: "nollywin-admin-auth" }
  )
);
