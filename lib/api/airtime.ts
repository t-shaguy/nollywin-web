/**
 * Airtime payment API client
 * 
 * IMPORTANT: This calls our own Next.js API route (/api/airtime/subscribe),
 * NOT the core backend. Therefore it uses plain fetch instead of apiClient
 * (which prefixes /core-api).
 */

const isDev = process.env.NODE_ENV === "development";

interface StartAirtimeSubscriptionRequest {
  packageId: string; // UUID string from packages API
  msisdn: string;
}

interface StartAirtimeSubscriptionResponse {
  redirectUrl: string;
  transactionId: string;
  tid?: number;
}

/**
 * Start airtime subscription flow
 * Calls our Next.js API route (same-origin) which proxies to hello-spin endpoint
 */
export async function startAirtimeSubscription(
  data: StartAirtimeSubscriptionRequest
): Promise<StartAirtimeSubscriptionResponse> {
  const payload = {
    packageId: data.packageId, // Keep as string
    msisdn: data.msisdn,
  };

  // Get player token from auth store for authentication
  let playerToken: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = await import("@/store/auth-store");
      playerToken = useAuthStore.getState().token;
    } catch {
      throw new Error("Authentication required");
    }
  }

  if (!playerToken) {
    throw new Error("Authentication required");
  }

  const url = "/api/airtime/subscribe";

  if (isDev) {
    console.log("[Airtime Client] Request URL:", url);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${playerToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (isDev) {
      console.log("[Airtime Client] Response status:", response.status);
    }

    if (!response.ok) {
      // Parse error response
      let errorMessage = "Airtime payment is temporarily unavailable";
      try {
        const errorData = await response.json();
        if (errorData.message && typeof errorData.message === "string") {
          errorMessage = errorData.message;
        }
      } catch {
        // Failed to parse error, use default message
      }

      throw new Error(errorMessage);
    }

    const data: StartAirtimeSubscriptionResponse = await response.json();
    
    if (isDev) {
      console.log("[Airtime Client] Success, redirect URL:", data.redirectUrl);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Airtime payment is temporarily unavailable");
  }
}
