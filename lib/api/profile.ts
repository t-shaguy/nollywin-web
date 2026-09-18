/**
 * Profile API Service
 * 
 * User profile management endpoints
 */

import { apiClient, apiClientMultipart } from "./client";
import type { User } from "@/store/auth-store";

// ============================================================================
// Request/Response Types
// ============================================================================

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  alias: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface UploadAvatarResponse {
  message: string;
  avatarUrl: string;
}

export interface GetAvatarResponse {
  avatarUrl: string;
}

// Note: Change password endpoint TBD - may use auth reset-password or a dedicated endpoint
// Flagging for backend team clarification

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get current user's profile
 * GET /api/v1/users/profile
 */
export async function getProfile(): Promise<User> {
  return apiClient<User>("/api/v1/users/profile", {
    method: "GET",
  });
}

/**
 * Update current user's profile
 * PUT /api/v1/users/profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  return apiClient<UpdateProfileResponse>("/api/v1/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Upload user avatar
 * POST /api/v1/users/avatar
 */
export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
  const formData = new FormData();
  formData.append("avatar", file);
  
  return apiClientMultipart<UploadAvatarResponse>("/api/v1/users/avatar", formData, {
    method: "POST",
  });
}

/**
 * Get user avatar URL
 * GET /api/v1/users/avatar
 */
export async function getAvatar(): Promise<GetAvatarResponse> {
  return apiClient<GetAvatarResponse>("/api/v1/users/avatar", {
    method: "GET",
  });
}
