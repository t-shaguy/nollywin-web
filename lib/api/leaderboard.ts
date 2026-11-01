/**
 * Leaderboard & Rewards API Service (v2 - Verified Payloads)
 * 
 * Leaderboard rankings and raffle/rewards endpoints
 */

import { apiClient } from "./client";

// ============================================================================
// Leaderboard Types (VERIFIED from real API testing)
// ============================================================================

/**
 * CONFIRMED API RESPONSE:
 * GET /api/v1/game/leaderboard
 * {
 *   "periodEndsAt": "2026-10-01T00:00:00Z",
 *   "entries": [
 *     { "rank": 1, "authUserId": "...", "displayName": "Khalid1234", "points": 1100, "prizeAmount": 20000.00 }
 *   ]
 * }
 */
export interface LeaderboardEntry {
  rank: number;
  authUserId: string;
  displayName: string;
  points: number;
  prizeAmount: number;
}

export interface LeaderboardResponse {
  periodEndsAt: string; // ISO 8601 timestamp
  entries: LeaderboardEntry[];
}

// ============================================================================
// Rewards/Raffle Types (V37 - Points-based draws)
// ============================================================================

// V37: Prize tier for multi-prize draws (REAL BACKEND)
// Every draw has tiers (including single-prize draws with one "Winner" tier)
export interface PrizeTier {
  position: number; // Sort order
  tierName: string; // e.g. "Gold", "Silver", "Bronze", or "Winner" for single-prize
  prizeName: string;
  winnersCount: number;
}

// V37: Active draw from dashboard or list endpoint
// REAL BACKEND: All draws have prizeTiers array (including single-prize draws with one "Winner" tier)
// Legacy draws (Sept) have null dates, null myPoints, and ticket-based entry
// New draws: entered = true once player has earned points (myTickets = 1 but don't show ticket count)
export interface RaffleDraw {
  id: string;
  raffleCode: string; // V37: unique code like "NW-202611-0001"
  prizeName: string;
  scheduleLabel: string; // e.g. "Monthly Draw"
  startsOn: string | null; // V37: YYYY-MM-DD (UTC, inclusive) - null for legacy draws
  endsOn: string | null; // V37: YYYY-MM-DD (UTC, inclusive) - null for legacy draws
  drawDate: string | null; // V37: YYYY-MM-DD (UTC, when winners are drawn) - null for legacy draws
  maxWinners: number;
  prizeTiers: PrizeTier[]; // V37: All draws have tiers (single-prize = one "Winner" tier). Only legacy draws have []
  status: "ACTIVE" | "UPCOMING" | "COMPLETED" | "CANCELLED" | "CLOSED";
  entryCount: number; // V37: count of qualifying games (or tickets for legacy)
  entered?: boolean; // V37: true once player has earned points (myTickets becomes 1)
  myTickets?: number; // Legacy: user's ticket count (new draws also have this = 1 once entered, but don't show)
  myPoints?: number | null; // V37: user's points for this draw (null for legacy draws)
  winnersSelected: boolean;
  // Legacy fields (may be absent in v37 draws):
  ticketCostTokens?: number;
  userTicketCount?: number;
}

// Backend returns array directly, not wrapped in object
export type ActiveDrawsResponse = RaffleDraw[];

// ============================================================================
// Leaderboard API Functions
// ============================================================================

/**
 * Get monthly leaderboard
 * GET /api/v1/game/leaderboard
 * 
 * Note: Endpoint might support query params for period (daily/weekly/monthly)
 * For now, defaults to monthly as specified in the prompt
 */
export async function getLeaderboard(period: string = "monthly"): Promise<LeaderboardResponse> {
  const params = new URLSearchParams();
  if (period) {
    params.append("period", period);
  }
  
  const endpoint = params.toString()
    ? `/api/v1/game/leaderboard?${params.toString()}`
    : "/api/v1/game/leaderboard";
  
  return apiClient<LeaderboardResponse>(endpoint, {
    method: "GET",
  });
}

// ============================================================================
// Rewards/Raffle API Functions
// ============================================================================

/**
 * Get active raffle draws
 * GET /api/v1/rewards/draws/active
 * 
 * VERIFIED: Returns array of active draws directly
 */
export async function getActiveDraws(): Promise<ActiveDrawsResponse> {
  return apiClient<ActiveDrawsResponse>("/api/v1/rewards/draws/active", {
    method: "GET",
  });
}

// ============================================================================
// Raffle History Types (V37 - Points-based)
// ============================================================================

/**
 * V37 API RESPONSE (REAL POSTMAN):
 * GET /api/v1/rewards/draws/history?page=0&size=20
 * 
 * Returns array of user's past draw entries with win status
 * Fields: drawId, raffleCode, prizeName, drawStatus, myTickets (legacy), 
 *         winnerStatus ("SELECTED" or null), wonTier, wonPrize, createdAt
 * NO dates in history rows
 */
export interface RaffleHistoryEntry {
  drawId: string;
  raffleCode: string;
  prizeName: string;
  drawStatus: "ACTIVE" | "UPCOMING" | "CLOSED" | "CANCELLED";
  myTickets?: number; // Legacy draws: user's ticket count
  winnerStatus: "SELECTED" | null; // "SELECTED" if user won
  wonTier: string | null; // Tier name if won (e.g. "Gold"), null if didn't win
  wonPrize: string | null; // Prize name if won, null if didn't win
  createdAt: string; // ISO 8601
}

// Backend returns array directly, not paginated object
export type RaffleHistoryResponse = RaffleHistoryEntry[];

/**
 * Get user's raffle entry history
 * GET /api/v1/rewards/draws/history?page=0&size=20
 */
export async function getRaffleHistory(page: number = 0, size: number = 20): Promise<RaffleHistoryResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  
  return apiClient<RaffleHistoryResponse>(`/api/v1/rewards/draws/history?${params.toString()}`, {
    method: "GET",
  });
}
