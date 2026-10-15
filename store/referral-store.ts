import { create } from "zustand";
import { persist } from "zustand/middleware";

// VERIFIED: Backend returns reward fields in stats endpoint
interface ReferralState {
  referralCode: string | null;
  referralLink: string | null;
  totalReferred: number;
  verifiedReferred: number;
  rewardedReferrals: number;
  tokensEarned: number;
  rewardTokensPerReferral: number;
  maxRewardsPerReferrer: number;
  rewardsActive: boolean;
  isLoading: boolean;
  setReferral: (
    code: string, 
    link: string, 
    stats: {
      totalReferred: number;
      verifiedReferred: number;
      rewardedReferrals: number;
      tokensEarned: number;
      rewardTokensPerReferral: number;
      maxRewardsPerReferrer: number;
      rewardsActive: boolean;
    }
  ) => void;
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
      rewardedReferrals: 0,
      tokensEarned: 0,
      rewardTokensPerReferral: 0,
      maxRewardsPerReferrer: 0,
      rewardsActive: false,
      isLoading: false,
      
      // Legacy getter for backward compatibility
      get code() {
        return get().referralCode;
      },
      
      setReferral: (code, link, stats) => 
        set({ 
          referralCode: code, 
          referralLink: link, 
          totalReferred: stats.totalReferred,
          verifiedReferred: stats.verifiedReferred,
          rewardedReferrals: stats.rewardedReferrals,
          tokensEarned: stats.tokensEarned,
          rewardTokensPerReferral: stats.rewardTokensPerReferral,
          maxRewardsPerReferrer: stats.maxRewardsPerReferrer,
          rewardsActive: stats.rewardsActive,
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
 * VERIFIED: GET /api/v1/referrals/stats returns full stats including reward fields
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
      {
        totalReferred: statsData.totalReferred,
        verifiedReferred: statsData.verifiedReferred,
        rewardedReferrals: statsData.rewardedReferrals,
        tokensEarned: statsData.tokensEarned,
        rewardTokensPerReferral: statsData.rewardTokensPerReferral,
        maxRewardsPerReferrer: statsData.maxRewardsPerReferrer,
        rewardsActive: statsData.rewardsActive,
      }
    );
    
    return { link: linkData, stats: statsData };
  } catch (error) {
    useReferralStore.getState().setLoading(false);
    console.warn("Failed to fetch referral data:", error);
    throw error;
  }
}
