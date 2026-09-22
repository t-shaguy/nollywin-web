/**
 * Payments & Subscriptions API Service
 * 
 * Payment initiation/verification and subscription purchase endpoints
 * Backend uses Paystack for payment processing
 */

import { apiClient } from "./client";

// ============================================================================
// Payment Types
// ============================================================================

export type PaymentPurpose = "WALLET_TOPUP" | "SUBSCRIPTION" | "RAFFLE_TICKET" | string;

export interface InitiatePaymentRequest {
  amount: number; // Amount in Naira
  purpose: PaymentPurpose;
}

export interface InitiatePaymentResponse {
  message: string;
  reference: string;
  authorizationUrl?: string; // Paystack checkout URL
  accessCode?: string;
  [key: string]: any;
}

/**
 * VERIFIED: Real API response from GET /api/v1/payments/verify/{reference}
 * {
 *   "reference": "nw_RXrSEXYJ01VcTf5wEDpKy64C",
 *   "status": "ABANDONED",
 *   "amountKobo": 50000,
 *   "currency": "NGN"
 * }
 */
export interface VerifyPaymentResponse {
  reference: string;
  status: string; // Can be "success", "pending", "ABANDONED", or other values
  amountKobo: number; // Amount in kobo (divide by 100 for Naira)
  currency: string; // e.g., "NGN"
}

// ============================================================================
// Subscription Types
// ============================================================================

export type PlanId = "daily" | "weekly" | "monthly";

export interface PurchaseSubscriptionRequest {
  packageId: PlanId;
}

export interface PurchaseSubscriptionResponse {
  message: string;
  subscription: {
    id: string;
    packageId: PlanId;
    planName: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
    startDate: string;
    expiryDate: string;
    [key: string]: any;
  };
  payment?: {
    reference: string;
    authorizationUrl?: string;
  };
  [key: string]: any;
}

export interface Subscription {
  id: string;
  packageId: PlanId;
  planName: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
  startDate: string;
  expiryDate: string;
  amount?: number;
  [key: string]: any;
}

export interface MySubscriptionsResponse {
  subscriptions: Subscription[];
  activeSubscription?: Subscription;
  [key: string]: any;
}

// ============================================================================
// Payment API Functions
// ============================================================================

/**
 * Initiate a payment
 * POST /api/v1/payments/initiate
 * 
 * Returns a Paystack authorization URL to redirect the user to
 */
export async function initiatePayment(data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
  return apiClient<InitiatePaymentResponse>("/api/v1/payments/initiate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Verify a payment by reference
 * GET /api/v1/payments/verify/{reference}
 */
export async function verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
  return apiClient<VerifyPaymentResponse>(`/api/v1/payments/verify/${reference}`, {
    method: "GET",
  });
}

// ============================================================================
// Subscription API Functions
// ============================================================================

/**
 * Purchase a subscription package
 * POST /api/v1/subscriptions/purchase
 * 
 * May return a payment authorization URL if payment is required
 */
export async function purchaseSubscription(data: PurchaseSubscriptionRequest): Promise<PurchaseSubscriptionResponse> {
  return apiClient<PurchaseSubscriptionResponse>("/api/v1/subscriptions/purchase", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get user's subscription history
 * GET /api/v1/subscriptions/me
 */
export async function getMySubscriptions(): Promise<MySubscriptionsResponse> {
  return apiClient<MySubscriptionsResponse>("/api/v1/subscriptions/me", {
    method: "GET",
  });
}
