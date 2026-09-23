/**
 * Auth API Service (v2 - Verified Payloads)
 * 
 * All authentication endpoints go through the Core Auth Proxy (/api/v1/auth/*)
 * All requests include X-Client-Token header automatically via apiClient
 * Only authenticated endpoints need Authorization header
 */

import { apiClient } from "./client";

// ============================================================================
// Request/Response Types (VERIFIED from live backend testing)
// ============================================================================

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  alias: string;
  referralCode?: string;
  password: string;
  confirmPassword: string;
}

// VERIFIED: Register returns 202 Accepted with this exact message
export interface RegisterResponse {
  message: string; // "Registered. A verification code has been sent to <email>"
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
  purpose: "REGISTRATION" | "PASSWORD_RESET";
}

// VERIFIED: Login and Verify-OTP return IDENTICAL shapes
export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresInMinutes: number;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    alias: string | null;
    role: "PLAYER" | "ADMIN";
    status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
    lastPasswordChangedAt: string; // ISO 8601 timestamp
    avatarUrl: string | null;
    totalPoints: number;
    gamesPlayed: number;
    bestScore: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

// VERIFIED: Login returns AuthResponse shape
export type LoginResponse = AuthResponse;

// VERIFIED: Verify OTP returns AuthResponse shape
export type VerifyOtpResponse = AuthResponse;

export interface ResendOtpRequest {
  email: string;
  purpose: "REGISTRATION" | "PASSWORD_RESET";
}

export interface ResendOtpResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// Phone OTP (shapes TBD - not yet verified with live backend)
export interface PhoneOtpRequestRequest {
  phoneNumber: string;
}

export interface PhoneOtpRequestResponse {
  message: string;
}

export interface PhoneOtpVerifyRequest {
  phoneNumber: string;
  code: string;
}

export interface PhoneOtpVerifyResponse {
  message: string;
  accessToken?: string;
  profile?: any; // TODO: verify actual shape when phone auth is tested
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Register a new user (email-based)
 * POST /api/v1/auth/register
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return apiClient<RegisterResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Request phone OTP
 * POST /api/v1/auth/phone/otp/request
 */
export async function requestPhoneOtp(data: PhoneOtpRequestRequest): Promise<PhoneOtpRequestResponse> {
  return apiClient<PhoneOtpRequestResponse>("/api/v1/auth/phone/otp/request", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Verify phone OTP
 * POST /api/v1/auth/phone/otp/verify
 */
export async function verifyPhoneOtp(data: PhoneOtpVerifyRequest): Promise<PhoneOtpVerifyResponse> {
  return apiClient<PhoneOtpVerifyResponse>("/api/v1/auth/phone/otp/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Verify OTP for email/registration
 * POST /api/v1/auth/verify-otp
 */
export async function verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return apiClient<VerifyOtpResponse>("/api/v1/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Resend OTP
 * POST /api/v1/auth/resend-otp
 */
export async function resendOtp(data: ResendOtpRequest): Promise<ResendOtpResponse> {
  return apiClient<ResendOtpResponse>("/api/v1/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Login with email and password
 * POST /api/v1/auth/login
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Request password reset (sends OTP to email)
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return apiClient<ForgotPasswordResponse>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Reset password with OTP code
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return apiClient<ResetPasswordResponse>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// ============================================================================
// Change Password (Authenticated)
// ============================================================================

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

/**
 * Change password for authenticated user
 * 
 * NOTE: Endpoint TBD - needs backend team clarification
 * Could be POST /api/v1/auth/change-password or PUT /api/v1/users/password
 * Using /api/v1/auth/change-password for now as a reasonable guess
 * 
 * TODO: Confirm actual endpoint path with backend team once service is up
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return apiClient<ChangePasswordResponse>("/api/v1/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// ============================================================================
// Player Dashboard
// ============================================================================

export interface PlayerDashboard {
  displayName: string;
  totalPoints: number;
  pointsToday: number;
  tokensLeft: number;
  tokenCostPerPlay: number;
  monthlyRank: {
    rank: number | null;
    participants: number;
    topPercent: number | null;
    periodEndsAt: string;
  } | null;
  subscription: Record<string, unknown> | null;
  freeAttemptsLeft: number | null;
  activeRaffles: { id: string; prizeName: string; ticketCostTokens: number; entered: boolean; myTickets: number }[];
  unreadNotifications: number;
}

/**
 * Get player dashboard data (authenticated)
 * GET /api/v1/user/dashboard
 * 
 * Returns dashboard data including unread notifications count and other metrics
 */
export async function getPlayerDashboard(): Promise<PlayerDashboard> {
  return apiClient<PlayerDashboard>("/api/v1/user/dashboard", {
    method: "GET",
  });
}
