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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://3.211.19.155/nollywin/core";
const REQUEST_TIMEOUT = 15000; // 15 seconds

export class AdminApiError extends Error {
  status: number;
  error: string;
  path?: string;
  data?: unknown;

  constructor(params: { status: number; error: string; message: string; path?: string; data?: unknown }) {
    super(params.message);
    this.name = "AdminApiError";
    this.status = params.status;
    this.error = params.error;
    this.path = params.path;
    this.data = params.data;
  }
}

// In-memory cache for client token (shared with player client)
let clientTokenCache: string | null = null;
let clientTokenPromise: Promise<string> | null = null;

/**
 * Fetch the client token from our server route (keeps secrets server-side)
 */
async function getClientToken(): Promise<string> {
  // Return cached token if available
  if (clientTokenCache) {
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
      clientTokenCache = data.accessToken;
      return data.accessToken;
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
export function clearAdminClientToken() {
  clientTokenCache = null;
}

/**
 * Admin API client with three-layer auth:
 * - X-Client-Token (always)
 * - Authorization: Bearer <adminToken> (on /api/v1/admin/* routes, NOT on /api/v1/admin/auth/*)
 * - Timeout and typed error handling
 */
export async function adminApiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get client token (cached after first fetch)
  const clientToken = await getClientToken();

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
        // Admin session is invalid/expired — clear it and send back to admin login
        if (typeof window !== "undefined") {
          const { useAdminAuthStore } = await import("@/store/admin-auth-store");
          useAdminAuthStore.getState().logout();
          // Note: Using location.href for auth redirect as recommended by Next.js docs for auth flows
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/admin/login";
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
      
      throw new AdminApiError({
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
      throw new AdminApiError({
        status: 408,
        error: "Request Timeout",
        message: "Request timed out after 15 seconds",
      });
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new AdminApiError({
        status: 0,
        error: "Network Error",
        message: "Network error - please check your connection",
      });
    }

    // Re-throw AdminApiError as-is
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      throw error;
    }

    // Unknown error
    throw new AdminApiError({
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
  options: Omit<RequestInit, "body" | "headers"> = {}
): Promise<T> {
  // Get client token
  const clientToken = await getClientToken();

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
        if (typeof window !== "undefined") {
          const { useAdminAuthStore } = await import("@/store/admin-auth-store");
          useAdminAuthStore.getState().logout();
          // Note: Using location.href for auth redirect as recommended by Next.js docs for auth flows
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/admin/login";
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
      
      throw new AdminApiError({
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
      throw new AdminApiError({
        status: 408,
        error: "Request Timeout",
        message: "Upload timed out after 15 seconds",
      });
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new AdminApiError({
        status: 0,
        error: "Network Error",
        message: "Network error - please check your connection",
      });
    }

    // Re-throw AdminApiError as-is
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      throw error;
    }

    // Unknown error
    throw new AdminApiError({
      status: 500,
      error: "Unknown Error",
      message: error instanceof Error ? error.message : "Upload failed",
    });
  }
}
