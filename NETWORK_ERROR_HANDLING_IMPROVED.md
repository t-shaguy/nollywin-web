# Network Error Handling - Improved

## Problem
Console was being spammed with noisy error logs during network failures:
```
[apiClient] Raw fetch failure for "/api/v1/users/avatar" TypeError: Failed to fetch
[apiClient] Raw fetch failure for "/api/v1/users/profile" TypeError: Failed to fetch
[apiClient] Raw fetch failure for "/api/v1/referrals/stats" TypeError: Failed to fetch
[apiClient] Raw fetch failure for "/api/v1/referrals/link" TypeError: Failed to fetch
```

These errors occur when the backend server is temporarily unreachable (restart, deployment, network hiccup).

## Why It Was Noisy

The `apiClient()` and `apiClientBinary()` functions were logging every network error:

```typescript
// BEFORE (NOISY)
if (error instanceof TypeError && error.message === "Failed to fetch") {
  console.error("[apiClient] Raw fetch failure for", endpoint, error);  // ❌ Spams console
  throw new ApiError({ ... });
}
```

This resulted in:
- **Multiple duplicate errors** for the same transient issue
- **Console clutter** making real errors hard to find
- **No actionable information** - these are transient network issues, not code bugs

## Fix Applied

Removed the noisy console.error logs and improved the error message:

```typescript
// AFTER (CLEAN)
if (error instanceof TypeError && error.message === "Failed to fetch") {
  // Don't spam console - these are usually transient network issues
  throw new ApiError({
    status: 0,
    error: "Network Error",
    message: "Cannot reach server - please check your connection or try again",
  });
}
```

### Changes Made:

1. **Removed console.error** from `apiClient()` (line ~274)
2. **Removed console.error** from `apiClientBinary()` (line ~391)
3. **Improved error message** - More user-friendly wording
4. **Added comment** explaining why we don't log (transient issues)

## Error Handling Strategy

### Where Errors Are Logged:

Network errors are now only logged at the **call site** level where they can add context:

```typescript
// Profile page - logs with context
try {
  const profile = await getProfile();
  updateUser(profile);
} catch (err) {
  console.error("Failed to fetch profile:", err);  // ✅ One log with context
  // Silently fail - user data from auth store is still available
}
```

This is better because:
- ✅ One log per feature/page instead of one per endpoint
- ✅ Logs include context about what was being done
- ✅ Call sites can decide whether to log, show UI error, or fail silently
- ✅ Easier to trace which feature is affected

### Where Errors Are Handled in UI:

The profile page already handles network errors gracefully:

**Avatar Fetch Failure:**
- Silently falls back to showing placeholder avatar
- No user-facing error message (non-critical)

**Profile Data Fetch Failure:**
- Silently falls back to cached user data from auth store
- Page still works with slightly stale data

**Referral Data Fetch Failure:**
- Shows "Loading..." or fallback UI
- User can retry by refreshing

## What Users See Now

### Before Fix:
- 🔴 Console flooded with duplicate error messages
- 🔴 Hard to find actual bugs among the noise
- 🔴 Generic "Network error - please check your connection"

### After Fix:
- ✅ Clean console (only contextual errors logged once)
- ✅ Real bugs stand out clearly
- ✅ Better error message: "Cannot reach server - please check your connection or try again"

### User Experience:
- If backend is temporarily down, page shows:
  - Avatar: Placeholder (instead of crashing)
  - Profile: Cached data from auth store (slightly stale but functional)
  - Referrals: "Loading..." state or retry button
- When backend comes back up, a simple page refresh loads fresh data
- No error dialogs or scary messages for transient issues

## Network Error Root Causes

These "Failed to fetch" errors happen when:

1. **Backend Server Restart** - Server briefly unavailable (5-30 seconds)
2. **Deployment** - New code being deployed
3. **Network Hiccup** - Temporary connectivity issue
4. **Firewall/Security Group** - Port temporarily blocked
5. **Server Overload** - Too many requests, server not responding

## When to Worry

### Don't Worry If:
- ✅ Errors clear up after 30-60 seconds
- ✅ Page refresh fixes the issue
- ✅ Only happens occasionally

### Investigate If:
- 🔴 Errors persist for >5 minutes
- 🔴 ALL pages/features affected
- 🔴 Happens frequently (multiple times per hour)
- 🔴 Backend server status shows "stopped" or "unhealthy"

## Testing the Fix

1. **Open browser console** (F12 → Console)
2. **Navigate to profile page** while backend is down
3. **Check console**:
   - BEFORE: Would see 4-6 duplicate "[apiClient] Raw fetch failure..." logs
   - AFTER: See only 1-2 contextual "Failed to fetch profile:" logs

## Files Modified

1. ✅ `lib/api/client.ts` 
   - Removed console.error from apiClient() network error handler
   - Removed console.error from apiClientBinary() network error handler
   - Improved error message to be more user-friendly

## Related Documentation

- `NETWORK_ERROR_TROUBLESHOOTING.md` - Full diagnostic guide
- `TOKEN_BALANCE_CACHE_FIX.md` - HTTP caching fix
- `WALLET_RELOAD_FIX_V2.md` - Wallet balance sync fix

## Summary

**Problem**: Console spammed with duplicate network error logs
**Solution**: Suppress noisy logs at API client level, only log at call sites with context
**Result**: Clean console, better error messages, graceful degradation when backend is down
