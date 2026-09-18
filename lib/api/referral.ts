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

// VERIFIED: GET /api/v1/referrals/stats returns this exact shape
export interface ReferralStatsResponse {
  totalReferred: number;
  verifiedReferred: number;
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
 * VERIFIED: Returns { totalReferred, verifiedReferred }
 */
export async function getReferralStats(): Promise<ReferralStatsResponse> {
  return apiClient<ReferralStatsResponse>("/api/v1/referrals/stats", {
    method: "GET",
  });
}
