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

// In-memory cache for client token with expiry tracking
let clientTokenCache: string | null = null;
let clientTokenExpiry: number | null = null; // Unix timestamp in seconds
let clientTokenPromise: Promise<string> | null = null;

/**
 * Decode JWT and extract expiry timestamp (exp claim)
 */
function decodeJwtExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp || null; // exp is in seconds since epoch
  } catch (error) {
    console.error("Failed to decode JWT expiry:", error);
    return null;
  }
}

/**
 * Check if cached token is still valid (not expired or within 60s of expiry)
 */
function isCachedTokenValid(): boolean {
  if (!clientTokenCache || !clientTokenExpiry) {
    return false;
  }
  
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const bufferSeconds = 60; // Refresh token if it expires within 60 seconds
  
  return clientTokenExpiry > (nowInSeconds + bufferSeconds);
}

/**
 * Fetch the client token from our server route (keeps secrets server-side)
 */
async function getClientToken(): Promise<string> {
  // Return cached token if still valid
  if (isCachedTokenValid() && clientTokenCache) {
    return clientTokenCache;
  }

  // If a fetch is already in progress, wait for it
  if (clientTokenPromise) {
    return clientTokenPromise;
  }

  // Start new fetch
  clientTokenPromise = (async () => {
    try {
      const res = await fetch("/api/client-token");
      if (!res.ok) {
        throw new Error("Failed to fetch client token");
      }
      const data = await res.json();
      const token = data.accessToken;
      
      // Cache token and its expiry
      clientTokenCache = token;
      clientTokenExpiry = decodeJwtExpiry(token);
      
      if (!clientTokenExpiry) {
        console.warn("Client token has no expiry claim - will not proactively refresh");
      }
      
      return token;
    } catch (error) {
      console.error("Error fetching client token:", error);
      throw error;
    } finally {
      clientTokenPromise = null;
    }
  })();

  return clientTokenPromise;
}

/**
 * Clear the cached client token (useful for testing or on auth errors)
 */
export function clearClientToken() {
  clientTokenCache = null;
  clientTokenExpiry = null;
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
        if (playerToken) {
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
 * Shared retry logic for client token refresh
 * Returns true if should retry, false otherwise
 */
async function handleClientTokenError(error: any, isRetry: boolean): Promise<boolean> {
  if (isRetry) {
    // Already retried once, don't retry again
    return false;
  }
  
  if (isClientTokenError(error)) {
    console.warn("Client token error detected, refreshing token and retrying...");
    clearClientToken();
    return true;
  }
  
  return false;
}

/**
 * Base API client with two-layer auth (X-Client-Token + Authorization), timeout, and typed error handling
 * Automatically retries once with fresh client token if token expires mid-session
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<T> {
  // Get client token (cached after first fetch, auto-refreshes if near expiry)
  const clientToken = await getClientToken();

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

    // Re-throw ApiError as-is
    if ("status" in error && "message" in error) {
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
 * API client for binary responses (images, files)
 * Uses the same two-layer auth as apiClient, but returns Blob instead of JSON
 * Automatically retries once with fresh client token if token expires mid-session
 * 
 * Use this for:
 * - Get avatar image (GET /api/v1/users/avatar)
 */
export async function apiClientBinary(endpoint: string, isRetry: boolean = false): Promise<Blob> {
  // Get client token (auto-refreshes if near expiry)
  const clientToken = await getClientToken();

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

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      signal: controller.signal,
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

      const error = res.status === 404 
        ? new ApiError({
            status: 404,
            error: "Not Found",
            message: "No avatar uploaded",
          })
        : new ApiError({
            status: res.status,
            error: res.statusText,
            message: `Request failed with status ${res.status}`,
          });
      
      // Check if this is a client token error and retry if needed
      const shouldRetry = await handleClientTokenError(error, isRetry);
      if (shouldRetry) {
        return apiClientBinary(endpoint, true);
      }
      
      throw error;
    }

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

    // Re-throw ApiError as-is
    if ("status" in error && "message" in error) {
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
 * Automatically retries once with fresh client token if token expires mid-session
 * 
 * Use this for:
 * - Avatar upload (POST /api/v1/users/avatar)
 * - Bulk CSV question upload (POST /api/v1/admin/trivia/questions/bulk)
 * 
 * Do NOT set Content-Type manually - let the browser set the multipart boundary.
 */
export async function apiClientMultipart<T = any>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, "body" | "headers"> = {},
  isRetry: boolean = false
): Promise<T> {
  // Get client token (auto-refreshes if near expiry)
  const clientToken = await getClientToken();

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

    // Re-throw ApiError as-is
    if ("status" in error && "message" in error) {
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
