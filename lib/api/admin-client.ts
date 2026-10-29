/**
 * Admin API Client for NollyWin Core Service
 * 
 * Admin routes have THREE authentication models:
 * 1. Admin auth routes (/api/v1/admin/auth/*) - NO tokens required (login, password reset)
 * 2. Admin operational routes (/api/v1/admin/*) - X-Client-Token + Authorization: Bearer <adminToken>
 * 3. Client token is still required on ALL requests (fetched from /api/client-token)
 * 
 * On 401 from admin routes: logout admin only (not player) and redirect to /admin/login
 */

import { getSharedClientToken, clearSharedClientToken } from "./shared-client-token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://3.211.19.155/nollywin/core";
const REQUEST_TIMEOUT = 15000; // 15 seconds

export interface AdminApiErrorData {
  status: number;
  error: string;
  message: string;
  path?: string;
  data?: unknown;
}

/**
 * Create an admin API error object
 * Note: Returns a plain object instead of Error to avoid Next.js/Turbopack issues
 */
export function createAdminApiError(params: AdminApiErrorData) {
  return {
    name: "AdminApiError",
    message: params.message,
    status: params.status,
    error: params.error,
    path: params.path,
    data: params.data,
    toString() {
      return `AdminApiError: ${params.message} (Status: ${params.status})`;
    }
  };
}

/**
 * Clear the cached client token (useful for testing or on auth errors)
 */
export function clearAdminClientToken() {
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
  
  // 401/403 when we actually have a valid admin token (means client token is the issue)
  if ((error.status === 401 || error.status === 403)) {
    // Only treat as client token error if we have an admin token
    // (if no admin token, it's a normal auth error)
    if (typeof window !== "undefined") {
      try {
        const authStore = require("@/store/admin-auth-store").useAdminAuthStore;
        const adminToken = authStore.getState().session?.token;
        if (adminToken) {
          return true;
        }
      } catch {
        // Can't check admin token, assume not a client token issue
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
 * Admin API client with three-layer auth:
 * - X-Client-Token (always)
 * - Authorization: Bearer <adminToken> (on /api/v1/admin/* routes, NOT on /api/v1/admin/auth/*)
 * - Timeout and typed error handling
 * - Automatic retry once on client token errors
 */
export async function adminApiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<T> {
  // Get client token (cached and shared with player client)
  const clientToken = await getSharedClientToken();

  // Get admin token from admin auth store if available
  // BUT: Skip Authorization header if this is an auth route (/api/v1/admin/auth/*)
  let adminToken: string | null = null;
  const isAuthRoute = endpoint.startsWith("/api/v1/admin/auth/");
  
  if (!isAuthRoute && typeof window !== "undefined") {
    try {
      // Dynamic import to avoid SSR issues
      const { useAdminAuthStore } = await import("@/store/admin-auth-store");
      const session = useAdminAuthStore.getState().session;
      adminToken = session?.token ?? null;
    } catch {
      // Store not available yet, continue without admin token
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

    // Add Authorization header if admin token exists AND this is not an auth route
    if (adminToken && !isAuthRoute) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-2xx responses
    if (!res.ok) {
      // Handle expired/invalid admin session (only for authenticated admin routes)
      if (res.status === 401 && adminToken && !isAuthRoute) {
        // CRITICAL SAFETY CHECK: Only redirect to admin login if we're actually on an admin page
        // This prevents the bug where player pages accidentally import admin endpoints,
        // triggering a 401 that yanks regular players out of their session.
        const isOnAdminPage = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
        
        if (isOnAdminPage) {
          // Admin session is invalid/expired — clear it and send back to admin login
          if (typeof window !== "undefined") {
            const { useAdminAuthStore } = await import("@/store/admin-auth-store");
            useAdminAuthStore.getState().logout();
            // Note: Using location.href for auth redirect as recommended by Next.js docs for auth flows
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/admin/login";
          }
        } else {
          // We're NOT on an admin page - this means player code accidentally called an admin endpoint.
          // Log the error loudly but DON'T redirect, so we don't break the player experience.
          console.error(
            `[ADMIN CLIENT] 401 on admin endpoint from NON-ADMIN page! ` +
            `This is a bug: player-facing code should not import from lib/api/admin.ts. ` +
            `Endpoint: ${endpoint}, Current path: ${window.location.pathname}`
          );
        }
        // Still throw the error so any pending promises can handle it
      }

      let errorData: unknown;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
      }

      // Backend returns { status, error, message, path }
      const typedError = errorData as { error?: string; message?: string; path?: string };
      
      // Provide helpful context for 403 errors
      let errorMessage = typedError.message || `Request failed with status ${res.status}`;
      if (res.status === 403) {
        errorMessage = `Access denied: ${typedError.message || "You don't have permission to perform this action. This is a backend role/permission issue, not a CORS error. Contact your system administrator to verify your admin account has the required role permissions."}`;
      }
      
      throw createAdminApiError({
        status: res.status,
        error: typedError.error || res.statusText,
        message: errorMessage,
        path: typedError.path,
        data: errorData,
      });
    }

    // Handle empty responses (204 No Content, etc.)
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return null as T;
    }

    return res.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw createAdminApiError({
        status: 408,
        error: "Request Timeout",
        message: "Request timed out after 15 seconds",
      });
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw createAdminApiError({
        status: 0,
        error: "Network Error",
        message: "Network error - please check your connection",
      });
    }

    // Check if this is a client token error and retry if needed
    const shouldRetry = await handleClientTokenError(error, isRetry);
    if (shouldRetry) {
      return adminApiClient<T>(endpoint, options, true);
    }

    // Re-throw admin API errors as-is
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      throw error;
    }

    // Unknown error
    throw createAdminApiError({
      status: 500,
      error: "Unknown Error",
      message: error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}

/**
 * Admin API client for multipart/form-data requests (file uploads)
 * Uses the same three-layer auth as adminApiClient
 * 
 * Use this for:
 * - Bulk CSV question upload (POST /api/v1/admin/trivia/questions/bulk)
 * 
 * Do NOT set Content-Type manually - let the browser set the multipart boundary.
 */
export async function adminApiClientMultipart<T = unknown>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, "body" | "headers"> = {},
  isRetry: boolean = false
): Promise<T> {
  // Get client token (cached and shared with player client)
  const clientToken = await getSharedClientToken();

  // Get admin token from admin auth store
  let adminToken: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const { useAdminAuthStore } = await import("@/store/admin-auth-store");
      const session = useAdminAuthStore.getState().session;
      adminToken = session?.token ?? null;
    } catch {
      // Store not available yet, continue without admin token
    }
  }

  // Set up abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const headers: Record<string, string> = {};

    // CRITICAL: Add X-Client-Token header (required on ALL requests)
    headers["X-Client-Token"] = clientToken;

    // Add Authorization header if admin token exists
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
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
      // Handle expired/invalid admin session
      if (res.status === 401 && adminToken) {
        // CRITICAL SAFETY CHECK: Only redirect to admin login if we're actually on an admin page
        const isOnAdminPage = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
        
        if (isOnAdminPage) {
          if (typeof window !== "undefined") {
            const { useAdminAuthStore } = await import("@/store/admin-auth-store");
            useAdminAuthStore.getState().logout();
            // Note: Using location.href for auth redirect as recommended by Next.js docs for auth flows
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/admin/login";
          }
        } else {
          console.error(
            `[ADMIN CLIENT MULTIPART] 401 on admin endpoint from NON-ADMIN page! ` +
            `Endpoint: ${endpoint}, Current path: ${window.location.pathname}`
          );
        }
      }

      let errorData: unknown;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
      }

      const typedError = errorData as { error?: string; message?: string; path?: string };
      
      // Provide helpful context for 403 errors
      let errorMessage = typedError.message || `Upload failed with status ${res.status}`;
      if (res.status === 403) {
        errorMessage = `Access denied: ${typedError.message || "You don't have permission to perform this action. This is a backend role/permission issue. Contact your system administrator."}`;
      }
      
      throw createAdminApiError({
        status: res.status,
        error: typedError.error || res.statusText,
        message: errorMessage,
        path: typedError.path,
        data: errorData,
      });
    }

    // Handle empty responses
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return null as T;
    }

    return res.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw createAdminApiError({
        status: 408,
        error: "Request Timeout",
        message: "Upload timed out after 15 seconds",
      });
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw createAdminApiError({
        status: 0,
        error: "Network Error",
        message: "Network error - please check your connection",
      });
    }

    // Check if this is a client token error and retry if needed
    const shouldRetry = await handleClientTokenError(error, isRetry);
    if (shouldRetry) {
      return adminApiClientMultipart<T>(endpoint, formData, options, true);
    }

    // Re-throw admin API errors as-is
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      throw error;
    }

    // Unknown error
    throw createAdminApiError({
      status: 500,
      error: "Unknown Error",
      message: error instanceof Error ? error.message : "Upload failed",
    });
  }
}
