/**
 * Shared Client Token Cache
 * 
 * Deduplicates client token fetching between lib/api/client.ts (player) and lib/api/admin-client.ts (admin).
 * Both clients now use this single cache instead of maintaining separate ones.
 */

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
 * 
 * SHARED between player and admin API clients to prevent duplicate requests.
 */
export async function getSharedClientToken(): Promise<string> {
  // Return cached token if still valid
  if (isCachedTokenValid() && clientTokenCache) {
    return clientTokenCache;
  }

  // If a fetch is already in progress, wait for it (deduplication)
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
export function clearSharedClientToken() {
  clientTokenCache = null;
  clientTokenExpiry = null;
  clientTokenPromise = null;
}
