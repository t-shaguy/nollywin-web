import { create } from "zustand";
import { persist } from "zustand/middleware";

// VERIFIED: Backend returns { referralCode, referralLink } and { totalReferred, verifiedReferred }
interface ReferralState {
  referralCode: string | null;
  referralLink: string | null;
  totalReferred: number;
  verifiedReferred: number;
  isLoading: boolean;
  setReferral: (code: string, link: string, totalReferred: number, verifiedReferred: number) => void;
  setLoading: (loading: boolean) => void;
  // Legacy getter for backward compatibility during migration
  get code(): string | null;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referralCode: null,
      referralLink: null,
      totalReferred: 0,
      verifiedReferred: 0,
      isLoading: false,
      
      // Legacy getter for backward compatibility
      get code() {
        return get().referralCode;
      },
      
      setReferral: (code, link, totalReferred, verifiedReferred) => 
        set({ 
          referralCode: code, 
          referralLink: link, 
          totalReferred, 
          verifiedReferred, 
          isLoading: false 
        }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: "nollywin-referral" }
  )
);

/**
 * Fetch referral data from the API
 * Call this when the referral page is loaded or when data needs to be refreshed
 * 
 * VERIFIED: GET /api/v1/referrals/link returns { referralCode, referralLink }
 * VERIFIED: GET /api/v1/referrals/stats returns { totalReferred, verifiedReferred }
 */
export async function fetchReferralData() {
  try {
    const { getReferralLink, getReferralStats } = await import("@/lib/api/referral");
    useReferralStore.getState().setLoading(true);
    
    // Fetch both link and stats in parallel
    const [linkData, statsData] = await Promise.all([
      getReferralLink(),
      getReferralStats(),
    ]);
    
    useReferralStore.getState().setReferral(
      linkData.referralCode,
      linkData.referralLink,
      statsData.totalReferred,
      statsData.verifiedReferred
    );
    
    return { link: linkData, stats: statsData };
  } catch (error) {
    useReferralStore.getState().setLoading(false);
    console.error("Failed to fetch referral data:", error);
    throw error;
  }
}
