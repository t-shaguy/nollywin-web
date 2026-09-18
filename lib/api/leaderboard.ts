/**
 * Leaderboard & Rewards API Service (v2 - Verified Payloads)
 * 
 * Leaderboard rankings and raffle/rewards endpoints
 */

import { apiClient } from "./client";

// ============================================================================
// Leaderboard Types
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  playerName: string;
  alias?: string;
  score: number;
  gamesPlayed?: number;
  avatarUrl?: string;
  isCurrentUser?: boolean;
  [key: string]: any;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUserRank?: number;
  totalPlayers?: number;
  period?: "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME" | string;
  [key: string]: any;
}

// ============================================================================
// Rewards/Raffle Types (VERIFIED from live backend testing)
// ============================================================================

// VERIFIED: GET /api/v1/rewards/draws/active returns array of this shape
export interface RaffleDraw {
  id: string;
  prizeName: string;
  ticketCostTokens: number;
  scheduleLabel: string;
  maxWinners: number;
  status: "ACTIVE" | "UPCOMING" | "COMPLETED" | "CANCELLED";
  entryCount: number;
  winnersSelected: boolean;
  userTicketCount?: number; // Added by frontend after fetching user's tickets
}

// Backend returns array directly, not wrapped in object
export type ActiveDrawsResponse = RaffleDraw[];

export interface BuyTicketRequest {
  quantity?: number; // Default 1
}

export interface BuyTicketResponse {
  message: string;
  ticketNumbers?: string[];
  totalCost?: number;
  newBalance?: number;
  [key: string]: any;
}

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

/**
 * Buy a raffle ticket
 * POST /api/v1/rewards/draws/{drawId}/buy-ticket
 * 
 * Note: Response shape TBD - not yet verified with live backend
 */
export async function buyTicket(drawId: string, data?: BuyTicketRequest): Promise<BuyTicketResponse> {
  return apiClient<BuyTicketResponse>(`/api/v1/rewards/draws/${drawId}/buy-ticket`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}
