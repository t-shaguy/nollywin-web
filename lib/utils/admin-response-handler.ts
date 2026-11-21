import { AdminApiErrorData } from "@/lib/api/admin-client";

export interface AdminResponse {
  success?: boolean; // Optional for backwards compatibility
  message: string;
  status?: "APPROVED" | "PENDING_APPROVAL" | "REJECTED";
  changeRequestId?: string;
}

export interface HandleResponseOptions {
  onSuccess?: (response: AdminResponse) => void;
  onPendingApproval?: (response: AdminResponse) => void;
  onError?: (error: AdminApiErrorData) => void;
  successMessage?: string;
}

/**
 * Map HTTP status codes and errors to user-friendly messages
 */
export function getFriendlyErrorMessage(error: unknown): string {
  // Check if it's an admin API error object
  if (error && typeof error === "object" && "status" in error) {
    const apiError = error as AdminApiErrorData;
    // If backend provided a message, use it for these status codes
    if (apiError.status === 400 || apiError.status === 422 || apiError.status === 409) {
      return apiError.message || "The request couldn't be completed. Please check your input.";
    }

    // Map status codes to friendly messages
    switch (apiError.status) {
      case 401:
        return "Your session expired. Please log in again.";
      case 403:
        return "You don't have permission to do this.";
      case 404:
        return "We couldn't find that.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Something went wrong on our side. Please try again.";
      default:
        return apiError.message || "An error occurred. Please try again.";
    }
  }

  // Network errors
  if (error instanceof Error) {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "You appear to be offline.";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if the response indicates pending approval (HTTP 202)
 */
export function isPendingApproval(response: AdminResponse): boolean {
  return response.status === "PENDING_APPROVAL" && !!response.changeRequestId;
}

/**
 * Standard handler for all admin mutations
 * Centralizes the logic for success, pending approval, and error states
 */
export function handleAdminResponse(
  response: AdminResponse,
  options: HandleResponseOptions = {}
): void {
  const { onSuccess, onPendingApproval } = options;

  // Check if response indicates success (either explicit or by having required fields)
  const isSuccess = response.success !== false; // Default to true if not specified

  if (isSuccess) {
    if (isPendingApproval(response)) {
      onPendingApproval?.(response);
    } else {
      onSuccess?.(response);
    }
  }
}

/**
 * Logger that doesn't trigger Next.js dev overlay for expected errors
 */
export const adminLogger = {
  error: (message: string, error?: unknown) => {
    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as AdminApiErrorData;
      if (apiError.status < 500) {
        // Expected client/validation errors - use warn to avoid dev overlay
        console.warn(`[Admin] ${message}:`, error);
      } else {
        // Real server errors or unexpected issues
        console.error(`[Admin] ${message}:`, error);
      }
    } else {
      console.error(`[Admin] ${message}:`, error);
    }
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[Admin] ${message}`, data);
  },
  debug: (message: string, data?: unknown) => {
    console.debug(`[Admin] ${message}`, data);
  },
};
