/**
 * Admin API Service (REAL BACKEND - PROMPT 1 Implementation)
 * 
 * All admin endpoints under /api/v1/admin/*
 * 
 * KEY PATTERNS:
 * 1. Admin auth routes (/api/v1/admin/auth/*) - NO admin token required
 * 2. Admin operational routes (/api/v1/admin/*) - Require admin token (X-Client-Token + Authorization)
 * 3. MAKER-CHECKER: All writes return { timestamp, message, status: "PENDING_APPROVAL", changeRequestId }
 * 4. Pagination: 0-indexed with "size" param, response shape { page, entries, size, total }
 * 5. Response typing: Use AdminJson = Record<string, unknown> for unconfirmed shapes
 */

import { adminApiClient, adminApiClientMultipart } from "./admin-client";

// Flexible JSON type for unconfirmed API response shapes
type AdminJson = Record<string, unknown>;

// ============================================================================
// Admin Auth Types
// ============================================================================

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string; // REAL API SHAPE (not admin_token)
  email: string;
  [key: string]: unknown;
}

// ============================================================================
// Maker-Checker Types
// ============================================================================

export interface MakerCheckerWriteResponse {
  timestamp: string;
  message: string;
  status: "PENDING_APPROVAL";
  changeRequestId: string; // UUID string, not number
}

export interface ChangeRequest {
  id: string; // UUID
  resourceType: string;
  action: string; // "CREATE" | "UPDATE" | "DELETE" | "REDEEM" | "FULFIL"
  httpMethod: string;
  resourcePath: string;
  pathParams: string | null; // JSON string, must JSON.parse defensively: "{\"id\":\"fa93...\"}"
  requestBody: string | null; // JSON string, must JSON.parse defensively
  hasFile: boolean;
  proposedByEmail: string;
  proposedByRoles: string;
  financial: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  approvalNote: string | null;
  rejectionReason: string | null;
  resultSummary: string | null;
  createdAt: string;
  [key: string]: unknown;
}

// List endpoint returns a bare array in the sample we captured.
// If a live test shows a pagination wrapper instead, adjust getChangeRequests()
// to unwrap it — do not assume, check the actual response first.
export type ChangeRequestListResponse = ChangeRequest[];

// ============================================================================
// Dashboard/Analytics Types (REAL API)
// ============================================================================

export interface DashboardOverview {
  totalUsers: number;
  activeToday: number;
  revenueMtd: number; // in Naira (not kobo)
  totalQuestions: number;
  [key: string]: unknown;
}

export interface RevenueTrendEntry {
  date: string; // "YYYY-MM-DD"
  revenue: number; // in Naira (not kobo)
}

export interface RecentActivity {
  type: string;
  description: string;
  actorEmail: string;
  occurredAt: string; // ISO timestamp
}

// ============================================================================
// User Management Types (REAL API)
// ============================================================================

export interface AdminUserListItem {
  authUserId: string;
  alias: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  plan: string; // "FREE" or package name
  subscriptionStatus: string | null; // "ACTIVE", "EXPIRED", etc.
  packageName: string | null;
  tokenBalance: number;
  joinedAt: string; // ISO timestamp
  role: string; // "PLAYER", "ADMIN"
  [key: string]: unknown;
}

export interface AdminUserListResponse {
  page: number;
  entries: AdminUserListItem[];
  size: number;
  total: number;
}

export interface AdminUserDetail {
  authUserId: string;
  alias: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string;
  referralCode: string;
  tokenBalance: number;
  joinedAt: string;
  recentSubscriptions: unknown[]; // Array of subscription objects (shape TBD)
  [key: string]: unknown;
}

// ============================================================================
// Package Management Types (REAL API)
// ============================================================================

export interface SubscriptionPackage {
  id: number;
  name: string;
  durationDays: number;
  fee: number; // in Naira (not kobo)
  active: boolean;
  attemptsIncluded: number; // READ-ONLY
  attemptsPeriod: string; // READ-ONLY, e.g. "DAILY"
  [key: string]: unknown;
}

export interface CreatePackageRequest {
  name: string;
  durationDays: number;
  fee: number; // in Naira (not kobo)
  active: boolean;
}

export interface UpdatePackageRequest {
  name?: string;
  durationDays?: number;
  fee?: number; // in Naira (not kobo)
  active?: boolean;
}

// ============================================================================
// Trivia Setup Types (REAL API)
// ============================================================================

export interface TriviaCategory {
  id: string;
  name: string;
  active: boolean;
  [key: string]: unknown;
}

export interface TriviaStage {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  difficultyLabel: string | null;
  [key: string]: unknown;
}

export interface TriviaPrize {
  id: string;
  stageName: string;
  period: "WEEKLY" | "MONTHLY" | string;
  description: string;
  [key: string]: unknown;
}

export interface CreateCategoryRequest {
  name: string;
  active: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  active?: boolean;
}

export interface CreateStageRequest {
  name: string;
  sortOrder: number;
  active: boolean;
  difficultyLabel?: string;
}

export interface UpdateStageRequest {
  name?: string;
  sortOrder?: number;
  active?: boolean;
  difficultyLabel?: string;
}

// ============================================================================
// Rewards Draws Management Types (REAL API)
// ============================================================================

export interface RewardDraw {
  id: string;
  prizeName: string;
  ticketCostTokens: number;
  scheduleLabel: string;
  maxWinners: number;
  status: "ACTIVE" | "CLOSED" | string;
  entryCount: number;
  winnersSelected: boolean;
}

export interface CreateRewardDrawRequest {
  prizeName: string;
  ticketCostTokens: number;
  scheduleLabel: string;
  maxWinners: number;
  status: string; // "OPEN" typically
}

export interface CloseDrawRequest {
  drawId: number;
}

// ============================================================================
// Reports Types (REAL API)
// ============================================================================

// REAL backend response shape (confirmed)
export interface SubscriptionReportSummary {
  from: string;
  to: string;
  totalSubscriptions: number;
  totalRevenue: number; // in Naira
  byPackage: Array<Record<string, unknown>>;
  byStatus: Array<Record<string, unknown>>;
}

// Income report response shape (VERIFIED against live backend)
export interface IncomeReportEntry {
  key: string;
  amount: number; // in Naira
  count: number;
  byOrigin?: Array<{
    key: string;
    amount: number;
    count: number;
  }>;
}

export interface IncomeReportResponse {
  from: string;
  to: string;
  currency: string; // "NGN"
  totalIncome: number; // in Naira
  paymentCount: number;
  bySource: IncomeReportEntry[]; // Array with keys: "WEB", "AIRTIME", "USSD"
  telcoTotal: IncomeReportEntry; // Single object with key "AIRTIME_AND_USSD"
  byOrigin: Array<{
    key: string;
    amount: number;
    count: number;
  }>;
  byProduct: IncomeReportEntry[]; // Array with keys: "SUBSCRIPTIONS", "TOKEN_TOPUPS", "OTHER"
}

// ============================================================================
// Helper: Extract paginated list from response
// ============================================================================

// Removed extractList helper - not used in current implementation

// ============================================================================
// Admin Auth API Functions
// ============================================================================

/**
 * Admin login
 * POST /api/v1/admin/auth/login
 * 
 * NO admin token required (this is the auth route)
 */
export async function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  return adminApiClient<AdminLoginResponse>("/api/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// TEMP: remove when /admin/auth/login accepts AUTH role
/**
 * Temporary fallback for checker (AUTH role) login
 * Uses player auth endpoint but verifies admin access before returning
 * 
 * This will be removed once backend /admin/auth/login accepts AUTH role accounts
 */
export async function adminLoginFallback(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[adminLoginFallback] Attempting checker login via /api/v1/auth/login');
  }
  
  // Step 1: Try player auth endpoint
  const loginResponse = await adminApiClient<{ accessToken: string; email?: string; [key: string]: unknown }>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!loginResponse.accessToken) {
    throw new Error("No access token returned");
  }

  // Step 2: Verify admin access by testing change-requests endpoint
  try {
    await adminApiClient<unknown>(
      "/api/v1/admin/change-requests?status=PENDING",
      {
        headers: {
          Authorization: `Bearer ${loginResponse.accessToken}`,
        },
      }
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[adminLoginFallback] Access verified, checker login successful');
    }
    
    // Access verified, return in admin login format
    return {
      accessToken: loginResponse.accessToken,
      email: loginResponse.email || data.email,
    };
  } catch (verifyError: any) {
    // 401/403 means not an admin account
    if (verifyError?.status === 401 || verifyError?.status === 403) {
      throw new Error("This account doesn't have admin access.");
    }
    // Other errors, re-throw
    throw verifyError;
  }
}

// ============================================================================
// Dashboard API Functions (REAL BACKEND)
// ============================================================================

/**
 * Get dashboard overview stats
 * GET /api/v1/admin/dashboard/overview
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  return adminApiClient<DashboardOverview>("/api/v1/admin/dashboard/overview");
}

/**
 * Get revenue trend (daily breakdown)
 * GET /api/v1/admin/dashboard/revenue-trend
 */
export async function getRevenueTrend(): Promise<RevenueTrendEntry[]> {
  const response = await adminApiClient<AdminJson>("/api/v1/admin/dashboard/revenue-trend");
  // Backend returns array directly (not wrapped)
  if (Array.isArray(response)) {
    return response as RevenueTrendEntry[];
  }
  return [];
}

/**
 * Get recent activity feed
 * GET /api/v1/admin/dashboard/recent-activity
 */
export async function getRecentActivity(): Promise<RecentActivity[]> {
  const response = await adminApiClient<AdminJson>("/api/v1/admin/dashboard/recent-activity");
  // Backend returns array directly (not wrapped)
  if (Array.isArray(response)) {
    return response as RecentActivity[];
  }
  return [];
}

// ============================================================================
// User Management API Functions (REAL BACKEND)
// ============================================================================

/**
 * Get all users with pagination
 * GET /api/v1/admin/users?page={page}&size={size}
 * 
 * Pagination is 0-indexed, response shape: { page, entries, size, total }
 */
export async function getUsers(page: number = 0, size: number = 50): Promise<AdminUserListResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  
  return adminApiClient<AdminUserListResponse>(`/api/v1/admin/users?${params.toString()}`);
}

/**
 * Get a specific user by ID
 * GET /api/v1/admin/users/{authUserId}
 */
export async function getUserById(authUserId: string): Promise<AdminUserDetail> {
  return adminApiClient<AdminUserDetail>(`/api/v1/admin/users/${authUserId}`);
}

// ============================================================================
// Package Management API Functions (REAL BACKEND)
// ============================================================================

/**
 * Get all subscription packages
 * GET /api/v1/admin/packages
 * 
 * Returns array directly (not paginated)
 */
export async function getPackages(): Promise<SubscriptionPackage[]> {
  const response = await adminApiClient<AdminJson>("/api/v1/admin/packages");
  // Backend returns array directly
  if (Array.isArray(response)) {
    return response as SubscriptionPackage[];
  }
  return [];
}

/**
 * Create a subscription package (MAKER-CHECKER)
 * POST /api/v1/admin/packages
 * 
 * Returns changeRequestId, NOT the created package
 */
export async function createPackage(data: CreatePackageRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/packages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a subscription package (MAKER-CHECKER)
 * PUT /api/v1/admin/packages/{id}
 * 
 * Returns changeRequestId, NOT the updated package
 */
export async function updatePackage(id: number, data: UpdatePackageRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>(`/api/v1/admin/packages/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Disable a subscription package (MAKER-CHECKER)
 * POST /api/v1/admin/packages/{id}/disable
 */
export async function disablePackage(id: number): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>(`/api/v1/admin/packages/${id}/disable`, {
    method: "POST",
  });
}

/**
 * Enable a subscription package (MAKER-CHECKER)
 * POST /api/v1/admin/packages/{id}/enable
 */
export async function enablePackage(id: number): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>(`/api/v1/admin/packages/${id}/enable`, {
    method: "POST",
  });
}

// ============================================================================
// Trivia Setup API Functions (REAL BACKEND)
// ============================================================================

/**
 * Get all trivia categories
 * GET /api/v1/admin/trivia/categories
 */
export async function getTriviaCategories(): Promise<TriviaCategory[]> {
  const response = await adminApiClient<AdminJson>("/api/v1/admin/trivia/categories");
  if (Array.isArray(response)) {
    return response as TriviaCategory[];
  }
  return [];
}

/**
 * Create a trivia category (MAKER-CHECKER)
 * POST /api/v1/admin/trivia/categories
 */
export async function createTriviaCategory(data: CreateCategoryRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/trivia/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get all trivia stages
 * GET /api/v1/admin/trivia/stages
 */
export async function getTriviaStages(): Promise<TriviaStage[]> {
  const response = await adminApiClient<AdminJson>("/api/v1/admin/trivia/stages");
  if (Array.isArray(response)) {
    return response as TriviaStage[];
  }
  return [];
}

/**
 * Create a trivia stage (MAKER-CHECKER)
 * POST /api/v1/admin/trivia/stages
 */
export async function createTriviaStage(data: CreateStageRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/trivia/stages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get all trivia prizes
 * GET /api/v1/admin/trivia/prizes
 */
export async function getTriviaPrizes(): Promise<TriviaPrize[]> {
  const response = await adminApiClient<AdminJson>("/api/v1/admin/trivia/prizes");
  if (Array.isArray(response)) {
    return response as TriviaPrize[];
  }
  return [];
}

/**
 * Create a trivia prize (MAKER-CHECKER)
 * POST /api/v1/admin/trivia/prizes
 */
export interface CreatePrizeRequest {
  stageName: string;
  period: "WEEKLY" | "MONTHLY" | string;
  description: string;
}

export async function createTriviaPrize(data: CreatePrizeRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/trivia/prizes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Create a trivia question (MAKER-CHECKER)
 * POST /api/v1/admin/trivia/questions
 */
export interface CreateQuestionRequest {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  stageName: string;
  categoryName: string;
}

export async function createTriviaQuestion(data: CreateQuestionRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/trivia/questions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Download CSV template for bulk trivia questions upload
 * GET /api/v1/admin/trivia/questions/csv-template
 * Returns raw CSV text, not JSON
 */
/**
 * Download CSV template for bulk question upload
 * GET /api/v1/admin/trivia/questions/csv-template
 * 
 * Returns raw CSV text, not JSON
 */
export async function downloadTriviaQuestionsCsvTemplate(): Promise<void> {
  try {
    // Browser: use same-origin proxy; Server: use direct URL
    const API_BASE_URL = typeof window !== "undefined"
      ? "/core-api"
      : (process.env.NEXT_PUBLIC_API_URL ?? "http://3.211.19.155/nollywin/core");
    
    // Get admin token the CORRECT way (not from localStorage which doesn't exist)
    const { useAdminAuthStore } = await import("@/store/admin-auth-store");
    const adminToken = useAdminAuthStore.getState().session?.token ?? null;
    
    // Get client token
    const clientTokenRes = await fetch("/api/client-token");
    if (!clientTokenRes.ok) {
      throw new Error("Failed to get client token");
    }
    const { accessToken: clientToken } = await clientTokenRes.json();
    
    const headers: HeadersInit = {
      "X-Client-Token": clientToken,
    };
    
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/trivia/questions/csv-template`, {
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[downloadTriviaQuestionsCsvTemplate] Failed:", response.status, errorText);
      throw new Error(`Failed to download CSV template (${response.status}): ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const blob = new Blob([csvText], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trivia-questions-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("[downloadTriviaQuestionsCsvTemplate] Error:", error);
    throw error; // Re-throw so UI can display user-friendly message
  }
}

/**
 * Bulk upload trivia questions via CSV (MAKER-CHECKER)
 * POST /api/v1/admin/trivia/questions/bulk-upload
 * Content-Type: multipart/form-data
 */
export async function bulkUploadTriviaQuestions(file: File): Promise<MakerCheckerWriteResponse> {
  const formData = new FormData();
  formData.append("file", file);
  
  // Use adminApiClientMultipart which already handles auth correctly
  return adminApiClientMultipart<MakerCheckerWriteResponse>(
    "/api/v1/admin/trivia/questions/bulk-upload",
    formData
  );
}

// ============================================================================
// Rewards Draws Management API Functions (REAL BACKEND)
// ============================================================================

/**
 * Get all reward draws
 * GET /api/v1/admin/rewards/draws
 */
export async function getRewardDraws(): Promise<RewardDraw[]> {
  const response = await adminApiClient<AdminJson>("/api/v1/admin/rewards/draws");
  if (Array.isArray(response)) {
    return response as RewardDraw[];
  }
  return [];
}

/**
 * Create a reward draw (MAKER-CHECKER)
 * POST /api/v1/admin/rewards/draws
 */
export async function createRewardDraw(data: CreateRewardDrawRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/rewards/draws", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Close a reward draw (trigger winner selection)
 * POST /api/v1/admin/rewards/draws/{draw_id}/close
 * 
 * NOTE: This is NOT a maker-checker operation (immediate effect)
 */
export async function closeRewardDraw(drawId: string): Promise<{ message: string }> {
  return adminApiClient<{ message: string }>(`/api/v1/admin/rewards/draws/${drawId}/close`, {
    method: "POST",
  });
}

// ============================================================================
// Reports API Functions (REAL BACKEND)
// ============================================================================

/**
 * Get subscription report summary
 * GET /api/v1/admin/reports/subscriptions/summary
 * 
 * Optionally supports from/to date filters (Lagos time with +01:00 offset)
 */
export async function getSubscriptionReportSummary(filters?: {
  from?: string;
  to?: string;
}): Promise<SubscriptionReportSummary> {
  let url = "/api/v1/admin/reports/subscriptions/summary";
  
  if (filters && (filters.from || filters.to)) {
    const params = new URLSearchParams();
    if (filters.from) params.append("from", encodeURIComponent(filters.from));
    if (filters.to) params.append("to", encodeURIComponent(filters.to));
    url += `?${params.toString()}`;
  }
  
  const response = await adminApiClient<SubscriptionReportSummary>(url);
  // TODO(tartor): Remove this console.log once field names are confirmed
  if (process.env.NODE_ENV === 'development') {
    console.log("[getSubscriptionReportSummary] Raw response:", JSON.stringify(response));
  }
  return response;
}

/**
 * Get subscription entries report with filters (V39)
 * GET /api/v1/admin/reports/subscriptions
 * 
 * Filters:
 * - from/to: Date or date-time with timezone offset (e.g., 2024-01-01T00:00:00+01:00)
 * - search: Email or phone number (any format)
 * - packageId: Package ID (from packages list)
 * - status: ACTIVE, EXPIRED, etc. (values found in data)
 * - page/size: Pagination
 */
export async function getSubscriptionReport(filters?: {
  from?: string;
  to?: string;
  search?: string;
  packageId?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<{ page: number; entries: unknown[]; size: number; total: number }> {
  const params = new URLSearchParams();
  
  if (filters?.from) params.append("from", encodeURIComponent(filters.from));
  if (filters?.to) params.append("to", encodeURIComponent(filters.to));
  if (filters?.search) params.append("search", filters.search);
  if (filters?.packageId) params.append("packageId", filters.packageId);
  if (filters?.status) params.append("status", filters.status);
  
  params.append("page", (filters?.page ?? 0).toString());
  params.append("size", (filters?.size ?? 50).toString());
  
  const response = await adminApiClient<{ page: number; entries: unknown[]; size: number; total: number }>(
    `/api/v1/admin/reports/subscriptions?${params.toString()}`
  );
  
  // Defensive: handle both paginated and plain array responses
  if (Array.isArray(response)) {
    return {
      page: 0,
      entries: response,
      size: response.length,
      total: response.length,
    };
  }
  
  return response;
}

/**
 * @deprecated Use getSubscriptionReport with filters instead
 * TODO(backend): This endpoint returns 404, handle gracefully in UI
 */
export async function getSubscriptionReportList(page: number = 0, size: number = 50): Promise<AdminJson> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  
  return adminApiClient<AdminJson>(`/api/v1/admin/reports/subscriptions?${params.toString()}`);
}

// ============================================================================
// Game Settings API Functions
// ============================================================================

export interface GameSettings {
  pointsPerCorrectAnswer: number;
  secondsPerQuestion: number;
  leaderboardResetDay: number; // 1 = Monday, 7 = Sunday
}

export async function getGameSettings(): Promise<GameSettings> {
  return adminApiClient<GameSettings>("/api/v1/admin/game-settings");
}

export interface UpdateGameSettingsRequest {
  pointsPerCorrectAnswer: number;
  secondsPerQuestion: number;
}

export async function updateGameSettings(data: UpdateGameSettingsRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/game-settings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Token Exchange Rate API Functions
// ============================================================================

export interface TokenExchangeRateEntry {
  id: string;
  koboPerToken: number;
  effectiveFrom: string;
}

export async function getTokenExchangeRateHistory(): Promise<TokenExchangeRateEntry[]> {
  return adminApiClient<TokenExchangeRateEntry[]>("/api/v1/admin/token-exchange-rate");
}

export async function getCurrentTokenExchangeRate(): Promise<TokenExchangeRateEntry> {
  return adminApiClient<TokenExchangeRateEntry>("/api/v1/admin/token-exchange-rate/current");
}

export async function setTokenExchangeRate(koboPerToken: number): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/token-exchange-rate", {
    method: "POST",
    body: JSON.stringify({ koboPerToken }),
  });
}

// V36 draw management functions removed - replaced by V37 endpoints below

// ============================================================================
// Leaderboard Prizes API Functions
// ============================================================================

export interface LeaderboardPrize {
  rank: number;
  prizeAmount: number;
}

/**
 * Get current leaderboard prize configuration
 * GET /api/v1/admin/leaderboard-prizes
 */
export async function getLeaderboardPrizes(): Promise<LeaderboardPrize[]> {
  const response = await adminApiClient<AdminJson>("/api/v1/admin/leaderboard-prizes");
  if (Array.isArray(response)) {
    return response as LeaderboardPrize[];
  }
  return [];
}

export async function setLeaderboardPrize(rank: number, prizeAmount: number): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/leaderboard-prizes", {
    method: "POST",
    body: JSON.stringify({ rank, prizeAmount }),
  });
}

// ============================================================================
// Raffle Report API Functions
// ============================================================================

export async function getRaffleReport(params: {
  from?: string; to?: string; status?: string; raffleId?: string; email?: string; phone?: string; page?: number; size?: number;
}): Promise<AdminJson> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.append(k, String(v)); });
  return adminApiClient<AdminJson>(`/api/v1/admin/reports/raffles?${q.toString()}`);
}

/**
 * Get income report
 * GET /api/v1/admin/reports/income?from=&to=
 */
export async function getIncomeReport(params: {
  from?: string;
  to?: string;
}): Promise<IncomeReportResponse> {
  const q = new URLSearchParams();
  if (params.from) q.append("from", params.from);
  if (params.to) q.append("to", params.to);
  return adminApiClient<IncomeReportResponse>(`/api/v1/admin/reports/income?${q.toString()}`);
}

// ============================================================================
// Admin Notifications API Functions
// ============================================================================

export interface AdminNotificationEntry {
  id: string;
  authUserId: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  sentAt: string;
}

export interface AdminNotificationListResponse {
  page: number;
  entries: AdminNotificationEntry[];
  size: number;
  total: number;
}

export async function broadcastNotification(title: string, body: string): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify({ title, body }),
  });
}

export async function sendNotification(emails: string[], title: string, body: string): Promise<{ message: string }> {
  return adminApiClient<{ message: string }>("/api/v1/admin/notifications/send", {
    method: "POST",
    body: JSON.stringify({ emails, title, body }),
  });
}

export async function getSentNotifications(params: {
  from?: string; to?: string; type?: string; email?: string; phone?: string; search?: string; read?: boolean; page?: number; size?: number;
}): Promise<AdminNotificationListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.append(k, String(v)); });
  return adminApiClient<AdminNotificationListResponse>(`/api/v1/admin/notifications?${q.toString()}`);
}

// ============================================================================
// Payment Settings API Functions
// ============================================================================

export interface PaymentSetting {
  channel: "WEB" | "MOBILE";
  callbackUrl: string;
}

export async function getPaymentSettings(): Promise<PaymentSetting[]> {
  return adminApiClient<PaymentSetting[]>("/api/v1/admin/payment-settings");
}

export async function setPaymentCallbackUrl(channel: "WEB" | "MOBILE", callbackUrl: string): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/payment-settings", {
    method: "POST",
    body: JSON.stringify({ channel, callbackUrl }),
  });
}

// ============================================================================
// Admin Auth: Magic Link
// ============================================================================

export async function requestAdminMagicLink(email: string): Promise<{ message: string }> {
  return adminApiClient<{ message: string }>("/api/v1/admin/auth/magic-link/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyAdminMagicLink(token: string): Promise<AdminLoginResponse> {
  return adminApiClient<AdminLoginResponse>("/api/v1/admin/auth/magic-link/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

// ============================================================================
// Audit Log API Functions
// ============================================================================

export interface AuditLogSummary {
  from: string;
  to: string;
  totalActions: number;
  successCount: number;
  failureCount: number;
  byResourceType: { resourceType: string; total: number; successCount: number; failureCount: number }[];
  byActor: { actorEmail: string; total: number }[];
}

export interface AuditLogListResponse {
  page: number;
  entries: Record<string, unknown>[];
  size: number;
  total: number;
}

export async function getAuditLog(params: {
  resourceType?: string; actorEmail?: string; description?: string; success?: boolean; from?: string; to?: string; page?: number; size?: number;
}): Promise<AuditLogListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.append(k, String(v)); });
  return adminApiClient<AuditLogListResponse>(`/api/v1/admin/audit-log?${q.toString()}`);
}

export async function getAuditLogSummary(): Promise<AuditLogSummary> {
  return adminApiClient<AuditLogSummary>("/api/v1/admin/audit-log/summary");
}

// ============================================================================
// Maker-Checker API Functions (REAL BACKEND)
// ============================================================================

/**
 * Get change requests, optionally filtered by status and resourceType.
 * GET /api/v1/admin/change-requests?status=PENDING&resourceType=RaffleDraw
 * 
 * V39: Added resourceType filter for Draws and Winners
 */
export async function getChangeRequests(
  status?: "PENDING" | "APPROVED" | "REJECTED",
  resourceType?: string
): Promise<ChangeRequest[]> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (resourceType) params.append("resourceType", resourceType);
  
  const query = params.toString();
  return adminApiClient<ChangeRequest[]>(`/api/v1/admin/change-requests${query ? `?${query}` : ''}`);
}

/**
 * Approve a change request. Returns the full updated ChangeRequest.
 * POST /api/v1/admin/change-requests/{id}/approve
 */
export async function approveChangeRequest(id: string, approvalNote?: string): Promise<ChangeRequest> {
  return adminApiClient<ChangeRequest>(`/api/v1/admin/change-requests/${id}/approve`, {
    method: "POST",
    body: approvalNote ? JSON.stringify({ approvalNote }) : undefined,
  });
}

/**
 * Reject a change request. Returns the full updated ChangeRequest.
 * POST /api/v1/admin/change-requests/{id}/reject
 */
export async function rejectChangeRequest(id: string, rejectionReason: string): Promise<ChangeRequest> {
  return adminApiClient<ChangeRequest>(`/api/v1/admin/change-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: rejectionReason }),
  });
}

/**
 * Get attached file for a change request (V39)
 * GET /api/v1/admin/change-requests/{id}/file
 * 
 * Returns: Binary blob (image or PDF)
 * Requires: hasFile: true on the change request
 */
export async function getChangeRequestFile(id: string): Promise<Blob> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_API_BASE_URL || ''}/api/v1/admin/change-requests/${id}/file`, {
    method: 'GET',
    headers: {
      'X-Client-Token': process.env.NEXT_PUBLIC_CLIENT_TOKEN || '',
      'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : ''}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch file: ${response.status} ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Not JSON, use default message
    }
    
    throw new Error(errorMessage);
  }

  return response.blob();
}

// ============================================================================
// Client Sync Management Types (CONFIRMED from live backend testing)
// ============================================================================

export interface SyncedClient {
  id: string; // UUID
  email: string;
  displayName: string; // e.g., "NollyWin Web App"
  channel: "WEB" | "MOBILE" | "ADMIN" | string;
  status: "ACTIVE" | "DISABLED" | string;
  locallyDisabled: boolean; // Can be disabled locally even if status is ACTIVE
  accessAllowed: boolean; // Derived from status and locallyDisabled
  partnerCode: string;
  lastSyncedAt: string | null; // ISO timestamp, can be null
}

export type SyncedClientListResponse = SyncedClient[];

// ============================================================================
// Client Sync API Functions
// ============================================================================

/**
 * Refresh synced clients from auth service
 * POST /api/v1/admin/clients-sync/refresh
 * 
 * Returns maker-checker response
 */
export async function refreshSyncedClients(): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/clients-sync/refresh", {
    method: "POST",
  });
}

/**
 * Get list of all synced clients
 * GET /api/v1/admin/clients-sync
 */
export async function getSyncedClients(): Promise<SyncedClientListResponse> {
  return adminApiClient<SyncedClientListResponse>("/api/v1/admin/clients-sync");
}

/**
 * Get synced client by email
 * GET /api/v1/admin/clients-sync/{email}
 */
export async function getSyncedClientByEmail(email: string): Promise<SyncedClient> {
  return adminApiClient<SyncedClient>(`/api/v1/admin/clients-sync/${encodeURIComponent(email)}`);
}

/**
 * Disable a synced client
 * POST /api/v1/admin/clients-sync/{email}/disable
 * 
 * Returns maker-checker response
 */
export async function disableSyncedClient(email: string): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>(`/api/v1/admin/clients-sync/${encodeURIComponent(email)}/disable`, {
    method: "POST",
  });
}

/**
 * Enable a synced client
 * POST /api/v1/admin/clients-sync/{email}/enable
 * 
 * Returns maker-checker response
 */
export async function enableSyncedClient(email: string): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>(`/api/v1/admin/clients-sync/${encodeURIComponent(email)}/enable`, {
    method: "POST",
  });
}

// ============================================================================
// Rewards/Draws Management (V37 - Points-based)
// ============================================================================

/**
 * V37 Draw Types (REAL BACKEND - verified against Postman)
 * V39: Added prizeType and cashAmount support
 */
export interface CreateDrawRequest {
  // raffleCode is generated by backend, NOT sent in request
  prizeName: string;
  scheduleLabel: string; // e.g. "Monthly Draw", "Weekly Draw"
  startsOn: string; // YYYY-MM-DD
  endsOn: string; // YYYY-MM-DD
  drawDate: string; // YYYY-MM-DD (when winners are drawn, can equal endsOn)
  maxWinners: number;
  prizeType?: "CASH" | "ITEM"; // V39: For single-prize draws (no tiers)
  cashAmount?: number; // V39: Required when prizeType is CASH (Naira)
  prizeTiers?: {
    position: number; // Sort order
    tierName: string;
    prizeName: string;
    winnersCount: number;
    prizeType?: "CASH" | "ITEM"; // V39: defaults to ITEM
    cashAmount?: number; // V39: Required when prizeType is CASH (Naira)
  }[];
}

export interface AdminDrawDetails {
  id: string;
  raffleCode: string;
  prizeName: string;
  scheduleLabel: string;
  startsOn: string | null; // null for legacy draws
  endsOn: string | null; // null for legacy draws
  drawDate: string | null; // null for legacy draws
  maxWinners: number;
  prizeType?: "CASH" | "ITEM"; // V39: For single-prize draws, optional (legacy = ITEM)
  cashAmount?: number | null; // V39: Cash amount in Naira
  prizeTiers: {
    position: number; // Sort order
    tierName: string;
    prizeName: string;
    winnersCount: number;
    prizeType?: "CASH" | "ITEM"; // V39: optional (legacy = ITEM)
    cashAmount?: number | null; // V39: Cash amount in Naira
  }[];
  status: "ACTIVE" | "CLOSED" | string; // Backend only uses ACTIVE/CLOSED, others are guessed
  entryCount: number;
  winnersSelected: boolean;
  createdAt?: string; // Not in real backend response
  updatedAt?: string; // Not in real backend response
}

export interface DrawStandingsEntry {
  position: number; // Verified shape
  authUserId: string;
  email: string; // Verified shape (not displayName)
  points: number;
  correctAnswers: number; // Verified shape
}

export interface DrawWinner {
  authUserId?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string | null;
  points?: number;
  rankPosition?: number; // Actual field from backend
  tier?: string | null; // Legacy field
  tierName?: string | null; // Actual field from backend
  prize?: string | null; // Legacy field
  prizeName?: string | null; // Actual field from backend
  selectedAt?: string;
  [key: string]: unknown; // Allow unknown fields
}

/**
 * Get all draws
 * GET /api/v1/admin/rewards/draws
 * 
 * REAL BACKEND: Returns plain array, NOT paginated
 * Backend doesn't support page/size/status params, filter client-side
 */
export async function getAdminDraws(status?: string): Promise<AdminDrawDetails[]> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[getAdminDraws] Calling GET /api/v1/admin/rewards/draws');
    }
    const response = await adminApiClient<AdminJson>(`/api/v1/admin/rewards/draws`);
    
    // Defensive: handle plain array or wrapped object
    let draws: AdminDrawDetails[];
    if (Array.isArray(response)) {
      draws = response as AdminDrawDetails[];
    } else if (response && typeof response === 'object' && 'entries' in response && Array.isArray(response.entries)) {
      draws = response.entries as AdminDrawDetails[];
    } else {
      draws = [];
    }
    
    // Client-side status filter
    if (status && status.trim()) {
      draws = draws.filter(d => d.status === status);
    }
    
    // Ensure prizeTiers is always an array
    return draws.map(d => ({
      ...d,
      prizeTiers: Array.isArray(d.prizeTiers) ? d.prizeTiers : [],
    }));
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getAdminDraws] Error:', err);
    }
    throw err;
  }
}

/**
 * Get draw by ID
 * GET /api/v1/admin/rewards/draws/{id}
 */
export async function getAdminDraw(id: string): Promise<AdminDrawDetails> {
  const response = await adminApiClient<AdminDrawDetails>(`/api/v1/admin/rewards/draws/${id}`);
  // Ensure prizeTiers is always an array
  return {
    ...response,
    prizeTiers: Array.isArray(response.prizeTiers) ? response.prizeTiers : [],
  };
}

/**
 * Create a new draw (MAKER-CHECKER)
 * POST /api/v1/admin/rewards/draws
 * 
 * NOTE: raffleCode is auto-generated by backend, do NOT include in request
 */
export async function createDraw(data: CreateDrawRequest): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>("/api/v1/admin/rewards/draws", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Close a draw (MAKER-CHECKER)
 * POST /api/v1/admin/rewards/draws/{id}/close
 * 
 * Closes qualifying period - no more entries accepted
 */
export async function closeDraw(id: string): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>(`/api/v1/admin/rewards/draws/${id}/close`, {
    method: "POST",
  });
}

/**
 * Get draw standings (qualifying players ranked by points)
 * GET /api/v1/admin/rewards/draws/{id}/standings
 * 
 * Verified shape: { position, authUserId, email, points, correctAnswers }[]
 */
export async function getDrawStandings(id: string): Promise<DrawStandingsEntry[]> {
  const response = await adminApiClient<AdminJson>(`/api/v1/admin/rewards/draws/${id}/standings`);
  if (Array.isArray(response)) {
    return response as DrawStandingsEntry[];
  }
  return [];
}

/**
 * Select winners (MAKER-CHECKER)
 * POST /api/v1/admin/rewards/draws/{id}/select-winners
 * 
 * Selects the top maxWinners players by points from standings as winners
 */
export async function selectDrawWinners(id: string): Promise<MakerCheckerWriteResponse> {
  return adminApiClient<MakerCheckerWriteResponse>(`/api/v1/admin/rewards/draws/${id}/select-winners`, {
    method: "POST",
  });
}

/**
 * Get draw winners (after selection)
 * GET /api/v1/admin/rewards/draws/{id}/winners
 */
export async function getDrawWinners(id: string): Promise<DrawWinner[]> {
  const response = await adminApiClient<AdminJson>(`/api/v1/admin/rewards/draws/${id}/winners`);
  if (Array.isArray(response)) {
    if (process.env.NODE_ENV === 'development' && response.length > 0) {
      console.debug('[getDrawWinners] First winner object shape:', response[0]);
    }
    return response as DrawWinner[];
  }
  return [];
}
