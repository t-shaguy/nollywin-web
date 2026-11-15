/**
 * Admin Winners Management API (V39)
 * 
 * All endpoints under /api/v1/admin/rewards/winners/*
 * Requires admin authentication (JWT groups: admin = maker, auth = checker)
 * 
 * Response shapes verified from dev backend (12 Nov 2024)
 */

import { adminApiClient, adminApiClientMultipart, adminApiClientBlob } from "./admin-client";

// ============================================================================
// Winners Types (VERIFIED)
// ============================================================================

export interface WinnerRow {
  id: string;
  drawId: string;
  raffleCode: string;
  drawName: string;
  drawDate: string | null; // null on older draws
  authUserId: string;
  subscriberName: string;
  email: string;
  phoneNumber: string; // "+2349160572310"
  subscriptionPackage: string | null; // "Daily" | "Weekly" | "Monthly"
  subscriptionStatus: string | null; // "ACTIVE" | "EXPIRED"
  tierName: string | null; // null on older draws without tiers
  prizeName: string | null; // null on older draws without tiers
  prizeType: "ITEM" | "CASH"; // Default to ITEM if missing
  cashAmount: number | null;
  rankPosition: number | null; // null on older draws
  points: number | null; // null on older draws
  status: "SELECTED" | "REDEEMED" | "DISBURSED";
  pendingAction: string | null; // "REDEEM" | "FULFIL" when awaiting approval
  pendingChangeRequestId: string | null;
  selectedAt: string; // ISO UTC
  redeemedAt: string | null;
  fulfilledAt: string | null;
}

export interface Proof {
  id: string;
  kind: string; // "COLLECTION_PHOTO", "ACCOUNT_ENQUIRY", "TRANSFER_RECEIPT", etc.
  contentType: string; // "image/jpeg", "application/pdf", etc.
  fileName: string;
  sizeBytes: number;
  uploadedBy: string; // email
  uploadedAt: string; // ISO UTC
}

export interface Redemption {
  id: string;
  prizeType: "ITEM" | "CASH";
  // CASH fields
  accountNumber: string | null;
  bankCode: string | null;
  bankName: string | null;
  accountName: string | null;
  // ITEM fields
  deliveryAddress: string | null;
  contactPhone: string | null;
  // Redeem step
  redeemNote: string | null;
  redeemedAt: string | null; // ISO UTC, moment the redeem was APPROVED
  redeemProposedBy: string | null; // email
  redeemApprovedBy: string | null; // email
  redeemChangeRequestId: string | null;
  // Fulfil step
  payoutReference: string | null; // CASH only
  fulfilledOn: string | null; // plain date "2026-11-12"
  fulfilNote: string | null;
  fulfilledAt: string | null; // ISO UTC, moment the fulfil was APPROVED
  fulfilProposedBy: string | null; // email
  fulfilApprovedBy: string | null; // email
  fulfilChangeRequestId: string | null;
  // Proofs
  proofs: Proof[];
}

export interface WinnerDetail {
  winner: WinnerRow;
  drawStartsOn: string | null; // null on older draws
  drawEndsOn: string | null; // null on older draws
  requires: "REDEEM_CASH" | "REDEEM_ITEM" | "FULFIL_CASH" | "FULFIL_ITEM" | null;
  redemption: Redemption | null; // null until first step is APPROVED
}

export interface WinnersListResponse {
  page: number; // 0-based
  entries: WinnerRow[];
  size: number;
  total: number;
}

// ============================================================================
// Redemptions Report Types (VERIFIED)
// ============================================================================

export interface RedemptionRow {
  winnerId: string;
  drawId: string;
  raffleCode: string;
  drawName: string;
  drawDate: string | null;
  subscriberName: string;
  email: string;
  phoneNumber: string;
  tierName: string | null;
  prizeName: string | null;
  prizeType: "ITEM" | "CASH";
  cashAmount: number | null;
  status: "REDEEMED" | "DISBURSED";
  // CASH fields (account number comes MASKED)
  accountNumber: string | null;
  bankCode: string | null;
  bankName: string | null;
  accountName: string | null;
  // ITEM fields
  deliveryAddress: string | null;
  payoutReference: string | null; // CASH only
  // Dates
  redeemedAt: string | null; // ISO UTC
  fulfilledOn: string | null; // plain date
  fulfilledAt: string | null; // ISO UTC
  // Approvers
  redeemApprovedBy: string | null; // email
  fulfilApprovedBy: string | null; // email
}

export interface RedemptionsListResponse {
  page: number; // 0-based
  entries: RedemptionRow[];
  size: number;
  total: number;
  totalCashPaid: number; // Naira
}

// ============================================================================
// Submit Response (VERIFIED)
// ============================================================================

export interface SubmitWinnerActionResponse {
  status: "PENDING_APPROVAL";
  changeRequestId: string;
  timestamp: string;
  message: string;
}

// ============================================================================
// Winners API Functions
// ============================================================================

/**
 * Helper: Convert user-provided date/datetime to UTC ISO 8601 with Z suffix
 * 
 * Lagos has no daylight saving (always UTC+1).
 * Convert Lagos wall-clock time to UTC for API.
 * 
 * If input is just a date (YYYY-MM-DD):
 * - from: Lagos 00:00:00 → UTC (previous day 23:00:00Z)
 * - to: Lagos 23:59:59 → UTC (same day 22:59:59Z)
 * 
 * If input already has time, parse and convert to UTC.
 * 
 * @param from Optional start date/datetime
 * @param to Optional end date/datetime
 * @returns Object with from/to as UTC ISO strings with Z suffix
 */
function buildLagosDateTimeParams(from?: string, to?: string): { from?: string; to?: string } {
  const result: { from?: string; to?: string } = {};
  
  const LAGOS_UTC_OFFSET_MS = 1 * 60 * 60 * 1000; // UTC+1
  
  if (from) {
    // If just a date, treat as Lagos 00:00:00
    if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      const [year, month, day] = from.split('-').map(Number);
      const lagosDate = new Date(year, month - 1, day, 0, 0, 0);
      const utcTimestamp = lagosDate.getTime() - LAGOS_UTC_OFFSET_MS;
      result.from = new Date(utcTimestamp).toISOString();
    } else {
      // Parse existing datetime and convert to UTC
      const date = new Date(from);
      if (!isNaN(date.getTime())) {
        const utcTimestamp = date.getTime() - LAGOS_UTC_OFFSET_MS;
        result.from = new Date(utcTimestamp).toISOString();
      }
    }
  }
  
  if (to) {
    // If just a date, treat as Lagos 23:59:59
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      const [year, month, day] = to.split('-').map(Number);
      const lagosDate = new Date(year, month - 1, day, 23, 59, 59);
      const utcTimestamp = lagosDate.getTime() - LAGOS_UTC_OFFSET_MS;
      result.to = new Date(utcTimestamp).toISOString();
    } else {
      // Parse existing datetime and convert to UTC
      const date = new Date(to);
      if (!isNaN(date.getTime())) {
        const utcTimestamp = date.getTime() - LAGOS_UTC_OFFSET_MS;
        result.to = new Date(utcTimestamp).toISOString();
      }
    }
  }
  
  return result;
}

/**
 * List winners with filters
 * GET /api/v1/admin/rewards/winners
 * 
 * Filters:
 * - drawId: Filter by specific draw
 * - status: SELECTED, REDEEMED, DISBURSED, PENDING_APPROVAL
 * - prizeType: CASH, ITEM
 * - search: Email, phone (any format), or draw code
 * - from/to: Selection date (Lagos time +01:00)
 * - page/size: Pagination (0-based)
 */
export async function listWinners(filters?: {
  drawId?: string;
  status?: string;
  prizeType?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}): Promise<WinnersListResponse> {
  const params = new URLSearchParams();
  
  if (filters?.drawId) params.append("drawId", filters.drawId);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.prizeType) params.append("prizeType", filters.prizeType);
  if (filters?.search) params.append("search", filters.search);
  
  // Lagos time dates
  const { from, to } = buildLagosDateTimeParams(filters?.from, filters?.to);
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  
  params.append("page", (filters?.page ?? 0).toString());
  params.append("size", (filters?.size ?? 50).toString());
  
  return adminApiClient<WinnersListResponse>(
    `/api/v1/admin/rewards/winners?${params.toString()}`
  );
}

/**
 * Get winner detail
 * GET /api/v1/admin/rewards/winners/{id}
 */
export async function getWinner(id: string): Promise<WinnerDetail> {
  return adminApiClient<WinnerDetail>(`/api/v1/admin/rewards/winners/${id}`);
}

/**
 * Redeem a winner (submit claim details - CASH or ITEM)
 * POST /api/v1/admin/rewards/winners/{id}/redeem (multipart/form-data)
 * 
 * Returns 202 PENDING_APPROVAL
 * Errors: 409 if already pending, 403 if checker tries, empty body = permission denied
 */
export async function redeemWinner(
  id: string,
  formData: FormData
): Promise<SubmitWinnerActionResponse> {
  return adminApiClientMultipart<SubmitWinnerActionResponse>(
    `/api/v1/admin/rewards/winners/${id}/redeem`,
    formData
  );
}

/**
 * Fulfil a winner (submit payout/handover proof - CASH or ITEM)
 * POST /api/v1/admin/rewards/winners/{id}/fulfil (multipart/form-data)
 * 
 * Returns 202 PENDING_APPROVAL
 * Errors: 409 if already pending, 403 if checker tries, empty body = permission denied
 */
export async function fulfilWinner(
  id: string,
  formData: FormData
): Promise<SubmitWinnerActionResponse> {
  return adminApiClientMultipart<SubmitWinnerActionResponse>(
    `/api/v1/admin/rewards/winners/${id}/fulfil`,
    formData
  );
}

/**
 * Fetch proof file blob
 * GET /api/v1/admin/rewards/winners/{winnerId}/proofs/{proofId}
 * 
 * Returns binary file with content-type header
 * Works for admin and checker roles
 */
export async function fetchProofBlob(
  winnerId: string,
  proofId: string
): Promise<{ blob: Blob; contentType: string; fileName: string }> {
  return adminApiClientBlob(
    `/api/v1/admin/rewards/winners/${winnerId}/proofs/${proofId}`
  );
}

/**
 * List redemptions (filtered report)
 * GET /api/v1/admin/reports/raffles/redemptions
 * 
 * Filters:
 * - status: REDEEMED, DISBURSED
 * - prizeType: CASH, ITEM
 * - from/to: Approval date (Lagos time +01:00)
 * - drawId: Filter by specific draw
 * - search: Email, phone, or draw code
 * - page/size: Pagination (0-based)
 */
export async function listRedemptions(filters?: {
  status?: string;
  prizeType?: string;
  from?: string;
  to?: string;
  drawId?: string;
  search?: string;
  page?: number;
  size?: number;
}): Promise<RedemptionsListResponse> {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append("status", filters.status);
  if (filters?.prizeType) params.append("prizeType", filters.prizeType);
  if (filters?.drawId) params.append("drawId", filters.drawId);
  if (filters?.search) params.append("search", filters.search);
  
  // Lagos time dates
  const { from, to } = buildLagosDateTimeParams(filters?.from, filters?.to);
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  
  params.append("page", (filters?.page ?? 0).toString());
  params.append("size", (filters?.size ?? 50).toString());
  
  return adminApiClient<RedemptionsListResponse>(
    `/api/v1/admin/reports/raffles/redemptions?${params.toString()}`
  );
}
