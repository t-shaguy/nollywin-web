# Step 4: Harden API Clients - COMPLETE ✅

**Date:** September 14, 2026  
**Status:** Complete and verified

## Summary

Enhanced React Query configuration with intelligent retry logic and exponential backoff. The API clients already had robust error handling (timeouts, client token refresh, network error detection), so the focus was on making React Query smarter about which errors to retry.

## Changes Made

### Enhanced React Query Configuration ✅

**File:** `components/providers/query-provider.tsx`

**Added Features:**
1. **Smart Retry Logic**
   - Only retries on transient/retryable errors:
     - Network errors (status 0)
     - Server errors (5xx)
     - Timeout errors (408)
     - Rate limit errors (429)
   - Does NOT retry on client errors (4xx: 400, 401, 403, 404, etc.)
   - Max 2 retries per request

2. **Exponential Backoff**
   - 1st retry: 1 second delay
   - 2nd retry: 2 seconds delay
   - 3rd retry (if needed): 4 seconds delay (capped)
   - Formula: `Math.min(1000 * 2 ** attemptIndex, 4000)`

3. **Keep Previous Data**
   - `placeholderData: (previousData: unknown) => previousData`
   - Shows old data while refetching (smoother UX, no loading flickers)

4. **Mutation Safety**
   - Mutations (POST/PUT/DELETE) don't retry by default
   - Safer for non-idempotent operations
   - Prevents duplicate submissions

**Code Added:**
```typescript
// Helper to determine if an error is retryable
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
  const err = error as { status?: number; name?: string };
  
  // Network errors - always retry
  if (err.status === 0 || err.name === "AbortError") return true;
  
  // 5xx errors - server issues, worth retrying
  if (err.status && err.status >= 500) return true;
  
  // 408 Request Timeout - retry
  if (err.status === 408) return true;
  
  // 429 Rate Limit - retry with backoff
  if (err.status === 429) return true;
  
  // Don't retry 4xx client errors
  return false;
}

// Query defaults
retry: (failureCount, error) => {
  if (failureCount >= 2) return false;
  return isRetryableError(error);
},
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
placeholderData: (previousData: unknown) => previousData,
```

## Existing Robustness (Already in API Clients)

The API clients (`lib/api/client.ts` and `lib/api/admin-client.ts`) already had solid error handling:

### 1. Request Timeout Protection
- **15 second timeout** on all requests using AbortController
- Prevents hanging requests from blocking UI
- Throws 408 error which triggers React Query retry

### 2. Client Token Auto-Refresh
- Detects when X-Client-Token is invalid (500 "Error invoking subclass method")
- Automatically refreshes token and retries once
- Prevents auth errors from bad client tokens

### 3. Network Error Detection
- Catches `TypeError: Failed to fetch` (network down)
- Throws status 0 error which triggers React Query retry
- User-friendly error messages

### 4. Session Management
- Auto-logout on 401 (expired session)
- Redirects to appropriate login page (player vs admin)
- Clears stale auth state

### 5. Error Classification
- Structured ApiError with status, error, message, path
- Consistent error handling across app
- Easy to debug with full context

## Build Status
✅ Build passed - Exit Code 0  
✅ TypeScript compilation successful  
✅ All 35 routes built successfully  
✅ No errors or warnings

## Impact

### Before Step 4:
```
Network blip or backend slowness:
- Request fails immediately
- User sees error
- Must manually retry (refresh page or click again)
- Poor experience on slow/unstable connections

Backend 500 error:
- Request fails immediately
- No retry
- User must refresh
```

### After Step 4:
```
Network blip or backend slowness:
- React Query retries automatically (1s, 2s delays)
- User sees old data (keepPreviousData)
- Most transient errors resolve automatically
- Smooth experience even on unstable connections

Backend 500 error:
- React Query retries twice with backoff
- Gives backend time to recover
- Only shows error if truly unavailable

Client errors (400, 401, 403, 404):
- No retry (correct behavior)
- Immediate feedback
- No wasted requests
```

## Error Retry Matrix

| Error Type | Status | Retry? | Why |
|------------|--------|--------|-----|
| Network error | 0 | ✅ Yes (2x) | Transient connectivity issue |
| Bad Request | 400 | ❌ No | Client error, won't fix itself |
| Unauthorized | 401 | ❌ No | Auth issue, needs user action |
| Forbidden | 403 | ❌ No | Permission issue, won't change |
| Not Found | 404 | ❌ No | Resource doesn't exist |
| Timeout | 408 | ✅ Yes (2x) | Server slow, might succeed |
| Rate Limit | 429 | ✅ Yes (2x) | Backoff then retry |
| Server Error | 500 | ✅ Yes (2x) | Transient server issue |
| Bad Gateway | 502 | ✅ Yes (2x) | Proxy/gateway issue |
| Service Unavailable | 503 | ✅ Yes (2x) | Server overloaded |

## Expected Benefits

1. **Better User Experience**
   - Fewer visible errors
   - Automatic recovery from transient issues
   - Smooth data transitions (no loading flickers)

2. **Reduced Support Burden**
   - Users don't need to "refresh and try again"
   - Transient errors resolve automatically
   - Only real errors surface to users

3. **Backend Resilience**
   - App survives brief backend hiccups
   - Exponential backoff prevents thundering herd
   - Rate limiting respected automatically

4. **Smarter Resource Usage**
   - No retries on 4xx errors (saves bandwidth)
   - Capped retry delays (max 4s)
   - Mutations don't retry (prevents duplicates)

## Next Steps

Ready for **Step 5: UI Resilience**
- Add inline error states to components
- Ensure all queries use keepPreviousData
- Add loading skeletons where needed
- Remove any remaining stagger delays
- Add prefetch={false} to nav links if needed
