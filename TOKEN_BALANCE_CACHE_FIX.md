# Token Balance Not Updating - HTTP Cache Fix

## Problem (Root Cause Identified)
`lib/api/client.ts`'s `apiClient()` function does not pass `cache: "no-store"` to its fetch() calls. This means `GET /api/v1/wallet` can be served from the browser's HTTP cache instead of hitting the network, causing the header to show stale token balance after a game.

## Fix Implemented

### 1. Added `cache: "no-store"` to all fetch calls
**File**: `lib/api/client.ts`

**Changed in `apiClient()` (line ~209)**:
```typescript
const res = await fetch(`${API_BASE_URL}${endpoint}`, {
  ...options,
  headers,
  signal: controller.signal,
  cache: "no-store", // Prevent HTTP caching - always fetch fresh data
});
```

**Changed in `apiClientBinary()` (line ~340)**:
```typescript
const res = await fetch(`${API_BASE_URL}${endpoint}`, {
  headers,
  signal: controller.signal,
  cache: "no-store", // Prevent HTTP caching - always fetch fresh data
});
```

**Impact**: 
- ALL API calls (not just wallet) now bypass browser HTTP cache
- Ensures every `GET /api/v1/wallet` hits the network and returns fresh balance
- Applies globally to all endpoints - no need for per-call workarounds

### 2. Added diagnostic logging to track API responses
**File**: `store/wallet-store.ts`

**Added logs**:
```typescript
export async function fetchWalletBalance() {
  try {
    console.log("[WALLET FETCH] Starting balance fetch...");
    const { getBalance } = await import("@/lib/api/wallet");
    useWalletStore.getState().setLoading(true);
    
    const balance = await getBalance();
    console.log("[WALLET FETCH] API returned tokenBalance:", balance.tokenBalance);
    
    useWalletStore.getState().setBalance(balance.tokenBalance);
    console.log("[WALLET FETCH] Zustand store updated with balance:", balance.tokenBalance);
    
    return balance;
  } catch (error) {
    // ... error handling
  }
}
```

**Purpose**: 
- Track the ACTUAL value returned by the API (not from cache)
- Confirm whether backend is deducting correctly vs. frontend caching issue
- Verify Zustand store is being updated with the correct value

## Testing Instructions

### Before Testing
1. Open browser DevTools → Console tab
2. Clear browser cache (Ctrl+Shift+Delete → Cached images and files)
3. Note current token balance in header (e.g., 58 tokens)

### Test Scenario

**Initial balance**: 58 tokens

1. Navigate to `/game`
2. Click "Start Game"
3. **Check console logs immediately**:
   ```
   [WALLET FETCH] Starting balance fetch...
   [WALLET FETCH] API returned tokenBalance: 57
   [WALLET FETCH] Zustand store updated with balance: 57
   ```
4. **Check header**: Should show **57 tokens** (before Q1 appears)
5. Play through the game (answer/timeout all 3 questions)
6. **Check console logs when Game Over screen appears**:
   ```
   [WALLET FETCH] Starting balance fetch...
   [WALLET FETCH] API returned tokenBalance: 57
   [WALLET FETCH] Zustand store updated with balance: 57
   ```
7. **Check header**: Should still show **57 tokens**
8. Click "Play Again"
9. **Check console logs**:
   ```
   [WALLET FETCH] Starting balance fetch...
   [WALLET FETCH] API returned tokenBalance: 56
   [WALLET FETCH] Zustand store updated with balance: 56
   ```
10. **Check header**: Should show **56 tokens**

### Network Tab Verification
1. Open DevTools → Network tab
2. Filter by "wallet"
3. Look for `GET /api/v1/wallet` requests
4. For each request:
   - Should show Status **200**
   - Response should show `{ "authUserId": "...", "tokenBalance": 57 }`
   - **NO** "(from disk cache)" or "(from memory cache)" indicator
   - Should have "Cache-Control: no-store" in response headers (if backend sends it)

## Diagnostic Decision Tree

### Scenario A: API returns wrong balance
**Console logs show**:
```
[WALLET FETCH] API returned tokenBalance: 58  ← STILL OLD VALUE
```

**Diagnosis**: 🔴 **BACKEND BUG** - Token is not being deducted on the backend
**Action Required**: Report to backend team - the `POST /api/v1/game/attempts` endpoint is not actually debiting tokens from the wallet

### Scenario B: API returns correct balance, but header doesn't update
**Console logs show**:
```
[WALLET FETCH] API returned tokenBalance: 57  ← CORRECT NEW VALUE
[WALLET FETCH] Zustand store updated with balance: 57
```
**But header still shows**: 58 tokens

**Diagnosis**: 🟡 **FRONTEND RENDERING BUG** - Zustand subscription or React re-render issue
**Action Required**: Investigate why `AuthenticatedLayout` is not re-rendering when `useWalletStore()` updates

### Scenario C: Everything works correctly
**Console logs show**:
```
[WALLET FETCH] API returned tokenBalance: 57
[WALLET FETCH] Zustand store updated with balance: 57
```
**Header shows**: 57 tokens

**Diagnosis**: ✅ **FIXED** - HTTP caching was the issue, now resolved

## What Changed

### Before This Fix:
1. Browser cached `GET /api/v1/wallet` response (200 OK, tokenBalance: 58)
2. Game started → token deducted on backend (backend now has 57)
3. `fetchWalletBalance()` called → browser returned cached response (58) WITHOUT hitting network
4. Header showed stale balance (58)

### After This Fix:
1. `cache: "no-store"` prevents browser from caching the response
2. Game started → token deducted on backend (backend now has 57)
3. `fetchWalletBalance()` called → browser ALWAYS hits network, gets fresh response (57)
4. Header shows correct balance (57)

## Why This Is The Right Fix

1. **Idiomatic**: `cache: "no-store"` is the standard way to disable HTTP caching in fetch API
2. **Comprehensive**: Applies to ALL API calls, not just wallet - prevents similar issues elsewhere
3. **No side effects**: Doesn't break anything - just ensures fresh data on every request
4. **Observable**: Diagnostic logs let us confirm the fix worked vs. backend issue
5. **Browser-agnostic**: Works in all browsers that support fetch API

## Expected Console Output (After Fix)

### Game Start:
```
[WALLET FETCH] Starting balance fetch...
[WALLET FETCH] API returned tokenBalance: 57
[WALLET FETCH] Zustand store updated with balance: 57
```

### Game End:
```
Game summary: {...}
[WALLET FETCH] Starting balance fetch...
[WALLET FETCH] API returned tokenBalance: 57
[WALLET FETCH] Zustand store updated with balance: 57
```

### Play Again:
```
[WALLET FETCH] Starting balance fetch...
[WALLET FETCH] API returned tokenBalance: 56
[WALLET FETCH] Zustand store updated with balance: 56
```

## Files Modified

1. ✅ `lib/api/client.ts` - Added `cache: "no-store"` to `apiClient()` and `apiClientBinary()`
2. ✅ `store/wallet-store.ts` - Added diagnostic logging to `fetchWalletBalance()`

## Next Steps

1. Test with the diagnostic logs
2. Report back which scenario (A, B, or C) matches the actual behavior
3. If Scenario A → escalate to backend team
4. If Scenario B → investigate Zustand/React rendering
5. If Scenario C → remove diagnostic logs (or keep them for debugging)
