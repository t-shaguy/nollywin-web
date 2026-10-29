/**
 * Wallet & Token API Service (Player-scoped)
 * 
 * Player-facing wallet/token endpoints with regular player authentication
 */

import { apiClient } from "./client";

// ============================================================================
// Wallet Balance Types
// ============================================================================

export interface WalletBalance {
  authUserId: string;
  tokenBalance: number;
}

// ============================================================================
// Token Exchange Rate Types
// ============================================================================

export interface TokenExchangeRate {
  koboPerToken: number;
}

// ============================================================================
// Wallet API Functions
// ============================================================================

/**
 * Get current user's wallet balance
 * GET /api/v1/wallet
 */
export async function getBalance(): Promise<WalletBalance> {
  return apiClient<WalletBalance>("/api/v1/wallet", {
    method: "GET",
  });
}

// ============================================================================
// Token Exchange Rate API Functions (Player-scoped)
// ============================================================================

/**
 * Get current token exchange rate (player-scoped endpoint)
 * GET /api/v1/token-exchange-rate/current
 * 
 * This is the PUBLIC player-facing endpoint for getting the exchange rate.
 * Players need this to see pricing on the Store page.
 * 
 * Admin version: lib/api/admin.ts getCurrentTokenExchangeRate() 
 * calls /api/v1/admin/token-exchange-rate/current (admin-only)
 */
export async function getCurrentTokenExchangeRate(): Promise<TokenExchangeRate> {
  return apiClient<TokenExchangeRate>("/api/v1/token-exchange-rate/current", {
    method: "GET",
  });
}
