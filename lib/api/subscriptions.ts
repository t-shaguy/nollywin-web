/**
 * Subscriptions API Service (Player-facing)
 * 
 * Player endpoints for viewing and purchasing subscription packages
 */

import { apiClient } from "./client";

// ============================================================================
// Types (VERIFIED from real API)
// ============================================================================

export interface SubscriptionPackage {
  id: string; // UUID
  name: string;
  durationDays: number;
  fee: number; // in Naira
  active: boolean;
  attemptsIncluded: number;
  attemptsPeriod: "DAY" | "MONTH" | string;
}

export interface UserSubscription {
  id: string;
  packageId: string;
  packageName: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
  paymentReference: string;
  startsAt: string; // ISO date
  expiresAt: string; // ISO date
  createdAt: string; // ISO date
}

export interface PurchasePackageRequest {
  packageId: string; // Real UUID, not fake "daily"/"weekly"/"monthly"
}

export interface PurchasePackageResponse {
  reference: string;
  authorizationUrl: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get available subscription packages (player-scoped)
 * GET /api/v1/subscriptions/packages
 */
export async function getAvailablePackages(): Promise<SubscriptionPackage[]> {
  return apiClient<SubscriptionPackage[]>("/api/v1/subscriptions/packages", {
    method: "GET",
  });
}

/**
 * Get user's current subscriptions
 * GET /api/v1/subscriptions/me?status=ACTIVE
 */
export async function getMySubscriptions(status?: "ACTIVE" | "EXPIRED" | "CANCELLED"): Promise<UserSubscription[]> {
  const query = status ? `?status=${status}` : "";
  return apiClient<UserSubscription[]>(`/api/v1/subscriptions/me${query}`, {
    method: "GET",
  });
}

/**
 * Purchase a subscription package
 * POST /api/v1/subscriptions/purchase
 * Returns Paystack authorization URL to redirect user
 */
export async function purchasePackage(data: PurchasePackageRequest): Promise<PurchasePackageResponse> {
  return apiClient<PurchasePackageResponse>("/api/v1/subscriptions/purchase", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
