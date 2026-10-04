/**
 * Referral API Service (v2 - Verified Payloads)
 * 
 * Referral link and stats endpoints
 */

import { apiClient } from "./client";

// ============================================================================
// Request/Response Types (VERIFIED from live backend testing)
// ============================================================================

// VERIFIED: GET /api/v1/referrals/link returns this exact shape
export interface ReferralLinkResponse {
  referralCode: string;
  referralLink: string;
}

// VERIFIED: GET /api/v1/referrals/stats returns this exact shape (updated with reward fields)
export interface ReferralStatsResponse {
  totalReferred: number;        // Total users who signed up with your code
  verifiedReferred: number;     // Total users who completed verification
  rewardedReferrals: number;    // Total referrals that actually triggered a reward payout
  tokensEarned: number;         // Total tokens actually paid out so far
  rewardTokensPerReferral: number;  // Current reward amount per referral (when active)
  maxRewardsPerReferrer: number;    // Max rewards cap (0 = uncapped)
  rewardsActive: boolean;           // Whether reward program is currently active
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get user's referral link and code
 * GET /api/v1/referrals/link
 * 
 * VERIFIED: Returns { referralCode, referralLink }
 */
export async function getReferralLink(): Promise<ReferralLinkResponse> {
  return apiClient<ReferralLinkResponse>("/api/v1/referrals/link", {
    method: "GET",
  });
}

/**
 * Get user's referral stats
 * GET /api/v1/referrals/stats
 * 
 * VERIFIED: Returns { totalReferred, verifiedReferred, rewardedReferrals, tokensEarned, 
 *                     rewardTokensPerReferral, maxRewardsPerReferrer, rewardsActive }
 */
export async function getReferralStats(): Promise<ReferralStatsResponse> {
  return apiClient<ReferralStatsResponse>("/api/v1/referrals/stats", {
    method: "GET",
  });
}
