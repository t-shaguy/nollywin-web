/**
 * Wallet API Service (v2 - Verified Payloads)
 * 
 * CRITICAL: Wallet only tracks tokenBalance. Points come from profile endpoint.
 */

import { apiClient } from "./client";

// ============================================================================
// Request/Response Types (VERIFIED from live backend testing)
// ============================================================================

// VERIFIED: GET /api/v1/wallet returns this exact shape
export interface WalletBalance {
  authUserId: string;
  tokenBalance: number;
}

// Transaction shape NOT YET VERIFIED - empty array returned on fresh account
// TODO: Verify exact shape once a real transaction exists
export interface Transaction {
  id?: string;
  type?: "CREDIT" | "DEBIT" | "TOPUP" | "GAME" | "REWARD" | string;
  amount?: number;
  description?: string;
  timestamp?: string;
  [key: string]: any; // Keep flexible until verified
}

export interface TransactionsResponse {
  transactions?: Transaction[];
  // Shape TBD - may be just an array [] or wrapped object
  [key: string]: any;
}

export interface TopupRequest {
  amount: number; // Amount in Naira, not tokens directly
}

export interface TopupResponse {
  message: string;
  transactionId?: string;
  newBalance?: number;
  [key: string]: any;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get wallet balance (tokens only)
 * GET /api/v1/wallet
 * 
 * VERIFIED: Returns { authUserId, tokenBalance }
 * Points are NOT in wallet - they come from profile endpoint
 */
export async function getBalance(): Promise<WalletBalance> {
  return apiClient<WalletBalance>("/api/v1/wallet", {
    method: "GET",
  });
}

/**
 * Get wallet transactions
 * GET /api/v1/wallet/transactions
 * 
 * @param limit - Number of transactions to fetch (defaults to 50 if not specified)
 * 
 * NOTE: Transaction shape not yet verified - returned empty array [] on fresh account.
 * Implement generically and revisit once real transactions exist.
 */
export async function getTransactions(limit?: number): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (limit !== undefined) {
    params.append("limit", limit.toString());
  }
  
  const endpoint = params.toString() 
    ? `/api/v1/wallet/transactions?${params.toString()}`
    : "/api/v1/wallet/transactions";
  
  const response = await apiClient<any>(endpoint, { method: "GET" });
  
  // Handle both array [] and object { transactions: [] } responses
  return Array.isArray(response) ? response : (response.transactions || []);
}

/**
 * Top up wallet
 * POST /api/v1/wallet/topup
 * 
 * Note: Amount is in Naira. Server-side conversion to tokens happens
 * via the exchange rate configured in the backend.
 */
export async function topup(amount: number): Promise<TopupResponse> {
  return apiClient<TopupResponse>("/api/v1/wallet/topup", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}
