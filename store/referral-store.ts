import { create } from "zustand";

interface ReferralStats {
  totalInvited: number;
  totalJoined: number;
  totalEarned: number;
}

interface ReferralState {
  code: string | null;
  stats: ReferralStats;
  setReferral: (code: string, stats: ReferralStats) => void;
}

export const useReferralStore = create<ReferralState>()((set) => ({
  // TODO: replace with GET /api/v1/referrals/me once the backend is live
  code: null,
  stats: { totalInvited: 0, totalJoined: 0, totalEarned: 0 },
  setReferral: (code, stats) => set({ code, stats }),
}));
