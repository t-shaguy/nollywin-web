/**
 * API Client for NollyWin Core Service (v2 - with two-layer auth)
 * 
 * CRITICAL: Every request requires TWO credentials:
 * 1. X-Client-Token - identifies the web app itself (fetched from /api/client-token)
 * 2. Authorization: Bearer <playerToken> - identifies the logged-in user (from auth-store)
 * 
 * Both headers MUST be present on authenticated requests. Missing X-Client-Token causes
 * 500 "Error invoking subclass method" on backend.
 */

import { getSharedClientToken, clearSharedClientToken } from "./shared-client-token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://3.211.19.155/nollywin/core";
const REQUEST_TIMEOUT = 15000; // 15 seconds

export class ApiError extends Error {
  status: number;
  error: string;
  path?: string;
  data?: any;

  constructor(params: { status: number; error: string; message: string; path?: string; data?: any }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.error = params.error;
    this.path = params.path;
    this.data = params.data;
  }
}

/**
 * Clear the cached client token (useful for testing or on auth errors)
 */
export function clearClientToken() {
  clearSharedClientToken();
}

/**
 * Check if an error indicates a client token problem
 */
function isClientTokenError(error: any): boolean {
  // 500 with "Error invoking subclass method" message
  if (error.status === 500 && error.message?.includes("Error invoking subclass method")) {
    return true;
  }
  
  // 401/403 when we actually have a valid player token (means client token is the issue)
  if ((error.status === 401 || error.status === 403)) {
    // Only treat as client token error if we have a player token
    // (if no player token, it's a normal auth error)
    if (typeof window !== "undefined") {
      try {
        const authStore = require("@/store/auth-store").useAuthStore;
        const playerToken = authStore.getState().token;
        if (playerToken && playerToken !== "guest-session-token") {
          return true;
        }
      } catch {
        // Can't check player token, assume not a client token issue
      }
    }
  }
  
  return false;
}

/**
 * Handle client token refresh on error
 * Returns true if should retry, false otherwise
 */
async function handleClientTokenError(error: any, isRetry: boolean): Promise<boolean> {
  if (isRetry) {
    // Already retried once, don't retry again
    return false;
  }
  
  if (isClientTokenError(error)) {
    console.warn("Client token error detected, refreshing token and retrying...");
    clearSharedClientToken();
    return true;
  }
  
  return false;
}

/**
 * Generic API client with two-layer auth (X-Client-Token + Authorization: Bearer)
 * Timeout and retry handling included
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<T> {
  // Get client token (cached and shared with admin client)
  const clientToken = await getSharedClientToken();

  // Get player token from auth store if available
  let playerToken: string | null = null;
  if (typeof window !== "undefined") {
    try {
      // Dynamic import to avoid SSR issues
      const { useAuthStore } = await import("@/store/auth-store");
      playerToken = useAuthStore.getState().token;
    } catch {
      // Store not available yet, continue without player token
    }
  }

  // Set up abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // CRITICAL: Add X-Client-Token header (required on ALL requests)
    headers["X-Client-Token"] = clientToken;

    // Add Authorization header if player token exists
    if (playerToken) {
      headers["Authorization"] = `Bearer ${playerToken}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
      cache: "no-store", // Prevent HTTP caching - always fetch fresh data
    });

    clearTimeout(timeoutId);

    // Handle non-2xx responses
    if (!res.ok) {
      // Handle expired/invalid session (only for authenticated requests)
      if (res.status === 401 && playerToken) {
        // Session is invalid/expired — clear it and send the user back to login
        if (typeof window !== "undefined") {
          const { useAuthStore } = await import("@/store/auth-store");
          useAuthStore.getState().logout();
          window.location.href = "/auth";
        }
        // Still throw the error so any pending promises can handle it
      }

      let errorData: any;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
      }

      // Backend returns { status, error, message, path }
      const error = new ApiError({
        status: res.status,
        error: errorData.error || res.statusText,
        message: errorData.message || `Request failed with status ${res.status}`,
        path: errorData.path,
        data: errorData,
      });
      
      // Check if this is a client token error and retry if needed
      const shouldRetry = await handleClientTokenError(error, isRetry);
      if (shouldRetry) {
        return apiClient<T>(endpoint, options, true);
      }
      
      throw error;
    }

    // Handle empty responses (204 No Content, etc.)
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return null as T;
    }

    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === "AbortError") {
      throw new ApiError({
        status: 408,
        error: "Request Timeout",
        message: "Request timed out after 15 seconds",
      });
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new ApiError({
        status: 0,
        error: "Network Error",
        message: "Network error - please check your connection",
      });
    }

    // Re-throw API errors as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown error
    throw new ApiError({
      status: 500,
      error: "Unknown Error",
      message: error.message || "An unknown error occurred",
    });
  }
}

/**
 * API client for multipart/form-data requests (file uploads)
 * Uses the same two-layer auth as apiClient
 * 
 * Use this for:
 * - Avatar upload (POST /api/v1/users/avatar)
 * 
 * Do NOT set Content-Type manually - let the browser set the multipart boundary.
 */
export async function apiClientMultipart<T = unknown>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, "body" | "headers"> = {},
  isRetry: boolean = false
): Promise<T> {
  // Get client token (cached and shared with admin client)
  const clientToken = await getSharedClientToken();

  // Get player token from auth store if available
  let playerToken: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = await import("@/store/auth-store");
      playerToken = useAuthStore.getState().token;
    } catch {
      // Store not available yet, continue without player token
    }
  }

  // Set up abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const headers: Record<string, string> = {};

    // CRITICAL: Add X-Client-Token header (required on ALL requests)
    headers["X-Client-Token"] = clientToken;

    // Add Authorization header if player token exists
    if (playerToken) {
      headers["Authorization"] = `Bearer ${playerToken}`;
    }

    // DO NOT set Content-Type - browser will set it with boundary
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: options.method || "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-2xx responses
    if (!res.ok) {
      // Handle expired/invalid session
      if (res.status === 401 && playerToken) {
        if (typeof window !== "undefined") {
          const { useAuthStore } = await import("@/store/auth-store");
          useAuthStore.getState().logout();
          window.location.href = "/auth";
        }
      }

      let errorData: any;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
      }

      const error = new ApiError({
        status: res.status,
        error: errorData.error || res.statusText,
        message: errorData.message || `Upload failed with status ${res.status}`,
        path: errorData.path,
        data: errorData,
      });
      
      // Check if this is a client token error and retry if needed
      const shouldRetry = await handleClientTokenError(error, isRetry);
      if (shouldRetry) {
        return apiClientMultipart<T>(endpoint, formData, options, true);
      }
      
      throw error;
    }

    // Handle empty responses
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return null as T;
    }

    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === "AbortError") {
      throw new ApiError({
        status: 408,
        error: "Request Timeout",
        message: "Upload timed out after 15 seconds",
      });
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new ApiError({
        status: 0,
        error: "Network Error",
        message: "Network error - please check your connection",
      });
    }

    // Re-throw API errors as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown error
    throw new ApiError({
      status: 500,
      error: "Unknown Error",
      message: error.message || "Upload failed",
    });
  }
}

/**
 * API client for binary responses (images, files)
 * Uses the same two-layer auth as apiClient
 * 
 * Use this for:
 * - Avatar download (GET /api/v1/users/avatar)
 * 
 * Returns a Blob instead of JSON.
 */
export async function apiClientBinary(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<Blob> {
  // Get client token (cached and shared with admin client)
  const clientToken = await getSharedClientToken();

  // Get player token from auth store if available
  let playerToken: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = await import("@/store/auth-store");
      playerToken = useAuthStore.getState().token;
    } catch {
      // Store not available yet, continue without player token
    }
  }

  // Set up abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // CRITICAL: Add X-Client-Token header (required on ALL requests)
    headers["X-Client-Token"] = clientToken;

    // Add Authorization header if player token exists
    if (playerToken) {
      headers["Authorization"] = `Bearer ${playerToken}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-2xx responses
    if (!res.ok) {
      // Handle expired/invalid session
      if (res.status === 401 && playerToken) {
        if (typeof window !== "undefined") {
          const { useAuthStore } = await import("@/store/auth-store");
          useAuthStore.getState().logout();
          window.location.href = "/auth";
        }
      }

      // For binary endpoints, try to parse error as JSON if possible
      let errorMessage = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Not JSON, use default message
      }

      const error = new ApiError({
        status: res.status,
        error: res.statusText,
        message: errorMessage,
      });
      
      // Check if this is a client token error and retry if needed
      const shouldRetry = await handleClientTokenError(error, isRetry);
      if (shouldRetry) {
        return apiClientBinary(endpoint, options, true);
      }
      
      throw error;
    }

    // Return the blob
    return res.blob();
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === "AbortError") {
      throw new ApiError({
        status: 408,
        error: "Request Timeout",
        message: "Request timed out after 15 seconds",
      });
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new ApiError({
        status: 0,
        error: "Network Error",
        message: "Network error - please check your connection",
      });
    }

    // Re-throw API errors as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown error
    throw new ApiError({
      status: 500,
      error: "Unknown Error",
      message: error.message || "An unknown error occurred",
    });
  }
}
