/**
 * Profile API Service
 * 
 * User profile management endpoints
 */

import { apiClient, apiClientMultipart, apiClientBinary } from "./client";
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
  // Note: avatarUrl is NOT in the response - backend only returns { message: "Avatar updated" }
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
 * Field name must be "file" (not "avatar")
 */
export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
  const formData = new FormData();
  formData.append("file", file); // CRITICAL: Backend expects "file" not "avatar"
  
  return apiClientMultipart<UploadAvatarResponse>("/api/v1/users/avatar", formData, {
    method: "POST",
  });
}

/**
 * Get user avatar as binary blob
 * GET /api/v1/users/avatar
 * Returns raw image binary (requires auth headers, not a public URL)
 */
export async function getAvatar(): Promise<Blob> {
  return apiClientBinary("/api/v1/users/avatar");
}
