/**
 * Admin API Service
 * 
 * All admin endpoints under /api/v1/admin/*
 * 
 * NOTE: These endpoints require admin credentials (admin_email/admin_password).
 * Admin login returns an admin_token used as Authorization: Bearer on all admin routes.
 * This API layer is wired but UNTESTED pending admin credentials from backend team.
 */

import { apiClient, apiClientMultipart } from "./client";

// ============================================================================
// Admin Auth Types
// ============================================================================

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  admin_token: string;
  admin: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// ============================================================================
// Dashboard/Analytics Types
// ============================================================================

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  totalRevenue: number;
  [key: string]: any;
}

// ============================================================================
// Package Management Types
// ============================================================================

export interface SubscriptionPackage {
  id: string;
  name: string;
  duration: number; // days
  price: number;
  attempts: number;
  active: boolean;
  [key: string]: any;
}

export interface CreatePackageRequest {
  name: string;
  duration: number;
  price: number;
  attempts: number;
  active?: boolean;
}

// ============================================================================
// Trivia Setup Types
// ============================================================================

export interface TriviaQuestion {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  stage: number;
  active: boolean;
  [key: string]: any;
}

export interface CreateQuestionRequest {
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  stage: number;
  active?: boolean;
}

// ============================================================================
// User Management Types
// ============================================================================

export interface AdminUserListResponse {
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    alias: string;
    status: "ACTIVE" | "SUSPENDED" | "BANNED" | string;
    createdAt: string;
    [key: string]: any;
  }>;
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// Reports Types
// ============================================================================

export interface AdminReportResponse {
  reportType: string;
  data: any[];
  generatedAt: string;
  [key: string]: any;
}

// ============================================================================
// Admin Auth API Functions
// ============================================================================

/**
 * Admin login
 * POST /api/v1/admin/auth/login
 */
export async function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  return apiClient<AdminLoginResponse>("/api/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Dashboard API Functions
// ============================================================================

/**
 * Get admin dashboard stats
 * GET /api/v1/admin/dashboard
 */
export async function getDashboardStats(): Promise<AdminDashboardStats> {
  return apiClient<AdminDashboardStats>("/api/v1/admin/dashboard", {
    method: "GET",
  });
}

// ============================================================================
// Package Management API Functions
// ============================================================================

/**
 * Get all subscription packages
 * GET /api/v1/admin/packages
 */
export async function getPackages(): Promise<{ packages: SubscriptionPackage[] }> {
  return apiClient<{ packages: SubscriptionPackage[] }>("/api/v1/admin/packages", {
    method: "GET",
  });
}

/**
 * Create a subscription package
 * POST /api/v1/admin/packages
 */
export async function createPackage(data: CreatePackageRequest): Promise<SubscriptionPackage> {
  return apiClient<SubscriptionPackage>("/api/v1/admin/packages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a subscription package
 * PUT /api/v1/admin/packages/{id}
 */
export async function updatePackage(id: string, data: Partial<CreatePackageRequest>): Promise<SubscriptionPackage> {
  return apiClient<SubscriptionPackage>(`/api/v1/admin/packages/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a subscription package
 * DELETE /api/v1/admin/packages/{id}
 */
export async function deletePackage(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/v1/admin/packages/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// Trivia Setup API Functions
// ============================================================================

/**
 * Get all trivia questions
 * GET /api/v1/admin/trivia/questions
 */
export async function getQuestions(filters?: { stage?: number; difficulty?: string }): Promise<{ questions: TriviaQuestion[] }> {
  const params = new URLSearchParams();
  if (filters?.stage) params.append("stage", filters.stage.toString());
  if (filters?.difficulty) params.append("difficulty", filters.difficulty);
  
  const endpoint = params.toString()
    ? `/api/v1/admin/trivia/questions?${params.toString()}`
    : "/api/v1/admin/trivia/questions";
  
  return apiClient<{ questions: TriviaQuestion[] }>(endpoint, {
    method: "GET",
  });
}

/**
 * Create a trivia question
 * POST /api/v1/admin/trivia/questions
 */
export async function createQuestion(data: CreateQuestionRequest): Promise<TriviaQuestion> {
  return apiClient<TriviaQuestion>("/api/v1/admin/trivia/questions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a trivia question
 * PUT /api/v1/admin/trivia/questions/{id}
 */
export async function updateQuestion(id: string, data: Partial<CreateQuestionRequest>): Promise<TriviaQuestion> {
  return apiClient<TriviaQuestion>(`/api/v1/admin/trivia/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a trivia question
 * DELETE /api/v1/admin/trivia/questions/{id}
 */
export async function deleteQuestion(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/v1/admin/trivia/questions/${id}`, {
    method: "DELETE",
  });
}

/**
 * Bulk upload questions via CSV
 * POST /api/v1/admin/trivia/questions/bulk
 */
export async function bulkUploadQuestions(file: File): Promise<{ message: string; imported: number }> {
  const formData = new FormData();
  formData.append("file", file);
  
  return apiClientMultipart<{ message: string; imported: number }>(
    "/api/v1/admin/trivia/questions/bulk",
    formData,
    { method: "POST" }
  );
}

// ============================================================================
// User Management API Functions
// ============================================================================

/**
 * Get all users with pagination
 * GET /api/v1/admin/users
 */
export async function getUsers(page: number = 1, limit: number = 50): Promise<AdminUserListResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  
  return apiClient<AdminUserListResponse>(`/api/v1/admin/users?${params.toString()}`, {
    method: "GET",
  });
}

/**
 * Get a specific user by ID
 * GET /api/v1/admin/users/{id}
 */
export async function getUserById(id: string): Promise<any> {
  return apiClient(`/api/v1/admin/users/${id}`, {
    method: "GET",
  });
}

/**
 * Update user status (suspend/activate/ban)
 * PUT /api/v1/admin/users/{id}/status
 */
export async function updateUserStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED"): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/v1/admin/users/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ============================================================================
// Reports API Functions
// ============================================================================

/**
 * Get revenue report
 * GET /api/v1/admin/reports/revenue
 */
export async function getRevenueReport(startDate?: string, endDate?: string): Promise<AdminReportResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const endpoint = params.toString()
    ? `/api/v1/admin/reports/revenue?${params.toString()}`
    : "/api/v1/admin/reports/revenue";
  
  return apiClient<AdminReportResponse>(endpoint, {
    method: "GET",
  });
}

/**
 * Get user activity report
 * GET /api/v1/admin/reports/users
 */
export async function getUserActivityReport(): Promise<AdminReportResponse> {
  return apiClient<AdminReportResponse>("/api/v1/admin/reports/users", {
    method: "GET",
  });
}

/**
 * Get game activity report
 * GET /api/v1/admin/reports/games
 */
export async function getGameActivityReport(): Promise<AdminReportResponse> {
  return apiClient<AdminReportResponse>("/api/v1/admin/reports/games", {
    method: "GET",
  });
}

// ============================================================================
// Token Exchange Rate API Functions
// ============================================================================

/**
 * Get current token exchange rate
 * GET /api/v1/admin/settings/exchange-rate
 */
export async function getExchangeRate(): Promise<{ rate: number; currency: string }> {
  return apiClient<{ rate: number; currency: string }>("/api/v1/admin/settings/exchange-rate", {
    method: "GET",
  });
}

/**
 * Update token exchange rate
 * PUT /api/v1/admin/settings/exchange-rate
 */
export async function updateExchangeRate(rate: number): Promise<{ message: string; rate: number }> {
  return apiClient<{ message: string; rate: number }>("/api/v1/admin/settings/exchange-rate", {
    method: "PUT",
    body: JSON.stringify({ rate }),
  });
}

// ============================================================================
// Rewards Draws Management API Functions
// ============================================================================

/**
 * Get all reward draws
 * GET /api/v1/admin/rewards/draws
 */
export async function getRewardDraws(): Promise<{ draws: any[] }> {
  return apiClient<{ draws: any[] }>("/api/v1/admin/rewards/draws", {
    method: "GET",
  });
}

/**
 * Create a reward draw
 * POST /api/v1/admin/rewards/draws
 */
export async function createRewardDraw(data: any): Promise<any> {
  return apiClient("/api/v1/admin/rewards/draws", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a reward draw
 * PUT /api/v1/admin/rewards/draws/{id}
 */
export async function updateRewardDraw(id: string, data: any): Promise<any> {
  return apiClient(`/api/v1/admin/rewards/draws/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Audit Log API Functions
// ============================================================================

/**
 * Get audit logs
 * GET /api/v1/admin/audit-log
 */
export async function getAuditLogs(page: number = 1, limit: number = 50): Promise<any> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  
  return apiClient(`/api/v1/admin/audit-log?${params.toString()}`, {
    method: "GET",
  });
}
