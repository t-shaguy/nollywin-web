# Wallet Token - Optimistic Update for Instant Feedback

## Problem
Token balance in header wasn't updating immediately when starting a game. User would see "56 tokens" before and after starting the game, even though 1 token should be deducted.

## Root Cause
The previous approach waited for the API call to complete before updating the UI:

```typescript
// BEFORE (SLOW)
1. User clicks "Start Game"
2. Call POST /api/v1/game/attempts (backend deducts token)
3. Wait for response...
4. AWAIT fetchWalletBalance() (fetch fresh balance from API)
5. Update UI with new balance
```

**Problem**: If the API call takes 500ms-2s, the header shows stale balance for that long, making it seem like nothing happened.

## Solution: Optimistic UI Update

Now we deduct the token IMMEDIATELY in the UI, then confirm with the API:

```typescript
// AFTER (INSTANT)
1. User clicks "Start Game"
2. Optimistically deduct 1 token from UI (56 → 55) ← INSTANT
3. Call POST /api/v1/game/attempts (backend deducts token)
4. Fetch fresh balance from API in background
5. Sync UI with real balance (usually same as optimistic)
```

**Benefit**: User sees immediate feedback - header updates instantly from 56 to 55 tokens.

## Implementation

### Optimistic Deduction
```typescript
const startGame = async () => {
  setError(null);
  
  // OPTIMISTIC UPDATE: Deduct token immediately for instant UI feedback
  const { deductTokens } = useWalletStore.getState();
  const deducted = deductTokens(1);
  
  if (!deducted) {
    setError("Insufficient tokens");
    setTimeout(() => router.push("/store"), 2000);
    return;
  }
  
  try {
    // Start game attempt
    const question = await gameApi.startAttempt();
    
    // ... set state ...
    
    // Fetch real balance from API to confirm
    try {
      await fetchWalletBalance();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      console.error("Failed to refresh wallet balance:", err);
      // Optimistic update already applied, continue with game
    }
  } catch (err) {
    // ROLLBACK: Game start failed, add the token back
    useWalletStore.getState().addTokens(1);
    
    setError(err.message);
    // ... error handling ...
  }
};
```

### Key Features:

1. **Instant UI Feedback**
   - Token deducted immediately: `deductTokens(1)`
   - Header updates instantly (56 → 55)
   - No perceived lag

2. **Pessimistic Check**
   - Checks if user has enough tokens BEFORE calling API
   - Prevents unnecessary API calls if insufficient balance

3. **Rollback on Failure**
   - If `startAttempt()` fails, we add the token back: `addTokens(1)`
   - User's balance is restored to original value
   - Prevents deducting token if game didn't actually start

4. **Eventual Consistency**
   - API fetch runs in background
   - Syncs UI with actual backend balance
   - Catches any discrepancies (e.g., if backend has different value)

## Flow Diagram

### Happy Path:
```
1. UI: 56 tokens
   ↓
2. User clicks "Start Game"
   ↓
3. deductTokens(1) → UI: 55 tokens ← INSTANT
   ↓
4. POST /api/v1/game/attempts → Backend: 55 tokens
   ↓
5. fetchWalletBalance() → Confirms: 55 tokens
   ↓
6. UI stays at 55 tokens (already correct)
```

### Error Path (Game Start Fails):
```
1. UI: 56 tokens
   ↓
2. User clicks "Start Game"
   ↓
3. deductTokens(1) → UI: 55 tokens
   ↓
4. POST /api/v1/game/attempts → ERROR (backend issue)
   ↓
5. addTokens(1) → UI: 56 tokens ← ROLLBACK
   ↓
6. Show error message to user
```

### Error Path (Balance Fetch Fails):
```
1. UI: 56 tokens
   ↓
2. User clicks "Start Game"
   ↓
3. deductTokens(1) → UI: 55 tokens
   ↓
4. POST /api/v1/game/attempts → Success, Backend: 55 tokens
   ↓
5. fetchWalletBalance() → ERROR (network issue)
   ↓
6. Game continues with optimistic 55 tokens
   (Will sync on next API call or page refresh)
```

## Why This Works

### Zustand Store is Reactive
```typescript
// authenticated-shell.tsx reads from store
const { tokenBalance } = useWalletStore();

// When store updates, component re-renders automatically
useWalletStore.getState().deductTokens(1); // Triggers re-render
```

The TopBar component subscribes to `useWalletStore()`, so when we call `deductTokens(1)`, it automatically re-renders with the new value.

### Multiple Layers of Safety

1. **Optimistic Update**: Instant UI feedback
2. **Backend Deduction**: Actual token deduction on server
3. **API Sync**: Confirms balance matches backend
4. **Rollback**: Restores balance if game start fails

All four layers ensure:
- ✅ User sees immediate feedback
- ✅ Backend is source of truth
- ✅ UI stays in sync with backend
- ✅ Errors are handled gracefully

## Expected Behavior Now

### Before Game:
- Header: **56 tokens**

### User Clicks "Start Game":
- Header: **55 tokens** ← **INSTANTLY** (optimistic)
- Question appears (while API sync happens in background)

### During Game:
- Header: **55 tokens** (confirmed by API)

### After Game (Game Over screen):
- Header: **55 tokens** (still same, token was deducted at start)

### Click "Play Again":
- Header: **54 tokens** ← **INSTANTLY** (optimistic)
- New game starts

## Testing Checklist

- [ ] Start with 56 tokens
- [ ] Click "Start Game"
- [ ] Header **immediately** shows 55 tokens (before first question loads)
- [ ] Play through game
- [ ] Header stays at 55 tokens
- [ ] Click "Play Again"
- [ ] Header **immediately** shows 54 tokens
- [ ] Check browser console for wallet logs (should confirm 54)

## Console Logs to Verify

You should see:
```
[WALLET FETCH] Starting balance fetch...
[WALLET FETCH] API returned tokenBalance: 55
[WALLET FETCH] Zustand store updated with balance: 55
```

**Important**: Even if the API fetch fails, the game continues with the optimistic balance. The balance will sync on the next successful API call.

## Files Modified

1. ✅ `app/features/game/presentation/trivia-flow.tsx`
   - Added optimistic `deductTokens(1)` before API call
   - Added pessimistic check for insufficient tokens
   - Added rollback `addTokens(1)` on game start failure
   - Kept background API fetch for eventual consistency

## Related Fixes

This builds on previous wallet fixes:
1. **HTTP Cache Fix**: `cache: "no-store"` prevents browser caching
2. **Await at Game Start**: Ensures API fetch completes
3. **Await at Game End**: Ensures balance fresh on Game Over screen
4. **Optimistic Update**: Instant UI feedback (this fix) ✅

All four layers work together to provide the best user experience.
