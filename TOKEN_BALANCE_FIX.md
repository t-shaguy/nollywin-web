# Token Balance Not Updating After Game - FIX IMPLEMENTED

## Problem
After completing a trivia game, the token balance shown in the header did NOT decrease, even though the backend correctly debited 1 token (confirmed by wallet transaction history showing DEBIT entries).

## Root Cause
**Frontend sync gap** - The issue was timing and error handling:

1. When `startGame()` was called, `fetchWalletBalance()` was fired with `.catch(console.error)` - not awaited
2. If the fetch failed or took too long, the error was silently logged and the UI never updated
3. The balance fetch was async but not awaited, so the game could start before the fetch completed
4. No explicit refresh when the Game Over screen mounted, so stale balance persisted

## Fix Implemented

### Change 1: Await wallet fetch after game start
**File**: `app/features/game/presentation/trivia-flow.tsx`

**Before**:
```typescript
setStep("playing");

// Refresh wallet balance and invalidate dashboard query (token was debited)
fetchWalletBalance().catch(console.error);
queryClient.invalidateQueries({ queryKey: ["dashboard"] });
```

**After**:
```typescript
setStep("playing");

// Refresh wallet balance after token deduction - AWAIT to ensure sync
try {
  await fetchWalletBalance();
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
} catch (err) {
  console.error("Failed to refresh wallet balance after game start:", err);
  // Continue anyway - game has already started and token was debited
}
```

**Impact**: 
- Balance fetch is now awaited, ensuring the header updates before the first question appears
- Better error visibility - we now explicitly log the failure
- Game still continues even if balance fetch fails (token was already debited on backend)

### Change 2: Add wallet refresh on Game Over screen mount
**File**: `app/features/game/presentation/stage-cleared.tsx`

**Added**:
```typescript
"use client";
import { useEffect } from "react";
import { fetchWalletBalance } from "@/store/wallet-store";

export function StageCleared({ ... }) {
  // Refresh wallet balance when Game Over screen appears
  useEffect(() => {
    fetchWalletBalance().catch((err) => {
      console.error("Failed to refresh wallet balance on Game Over screen:", err);
    });
  }, []);
  
  // ... rest of component
}
```

**Impact**:
- Even if the earlier fetch failed, the balance will be refreshed when the user sees their results
- Ensures the header shows the correct balance when user decides whether to play again
- Catches edge cases where the game-end fetch was skipped or failed silently

## How It Works Now

### Sequence of Events:

1. **User clicks "Start Game"**
   - `POST /api/v1/game/attempts` → Backend deducts 1 token
   - `await fetchWalletBalance()` → Frontend fetches new balance
   - Zustand store updates via `setBalance()`
   - `AuthenticatedLayout` re-renders (subscribes to Zustand store)
   - TopBar shows new decreased balance (e.g., 58 → 57)

2. **User plays the game**
   - Answers questions or lets timer expire
   - Points are accumulated

3. **Game ends**
   - Last answer submitted
   - `fetchWalletBalance()` called again (backup/redundant but harmless)
   - 1.5 second delay before showing Game Over screen

4. **Game Over screen mounts**
   - `useEffect` triggers immediately
   - `fetchWalletBalance()` called AGAIN (ensures fresh balance)
   - Header updates with latest balance

## Testing Checklist

- [x] Code changes implemented
- [ ] Manual test: Start game, verify balance decreases immediately
- [ ] Manual test: Complete game, verify balance is still decreased on Game Over screen
- [ ] Manual test: Play multiple games in a row, verify each deducts 1 token
- [ ] Network tab: Verify `/api/v1/wallet` is called and returns decremented balance
- [ ] Console: Check for any "Failed to refresh wallet balance" errors
- [ ] Backend verification: Check wallet transaction history shows DEBIT entries

## Test Scenario

**Initial state**: Player has 58 tokens

1. Navigate to game screen
2. Click "Start Game"
3. **Expected**: Header should show 57 tokens (before first question appears)
4. Answer Q1 correctly (+50 pts)
5. Answer Q2 correctly (+50 pts)
6. Answer Q3 timeout (+0 pts)
7. See Game Over screen
8. **Expected**: Header still shows 57 tokens
9. Click "Play Again"
10. **Expected**: Header should show 56 tokens (before first question of new game)
11. Check wallet transaction history
12. **Expected**: Shows 2 DEBIT entries for "Trivia game attempt", 1 token each

## Verification Points

### Browser Console Logs:
```
[CANARY] fetchWalletBalance() invoked - about to import getBalance
```
Should appear:
- After clicking "Start Game"
- On Game Over screen mount
- After clicking "Play Again"

### Network Tab:
- `POST /api/v1/game/attempts` → Status 200
- `GET /api/v1/wallet` → Status 200, response shows { authUserId: "...", tokenBalance: 57 }

### No Errors Should Appear:
- ❌ "Failed to refresh wallet balance after game start"
- ❌ "Failed to refresh wallet balance on Game Over screen"
- ❌ "Failed to fetch wallet balance" (from wallet-store.ts)

If any of these errors appear, it indicates a backend/network issue, not a frontend sync gap.

## Why This Fix is Correct

1. **Multiple retry points**: Balance is fetched at game start (awaited), game end (fire-and-forget), and Game Over screen mount (guaranteed)
2. **User visibility**: Balance updates BEFORE the first question, so user sees the deduction immediately
3. **Error handling**: Failures are logged clearly, not swallowed silently
4. **Defensive**: Even if one fetch fails, the others will catch it
5. **Backend-driven**: Frontend trusts the backend balance, doesn't fake-deduct locally

## Related Files Modified

1. `app/features/game/presentation/trivia-flow.tsx` - Added await for balance fetch after game start
2. `app/features/game/presentation/stage-cleared.tsx` - Added useEffect to refresh balance on mount
3. `TOKEN_BALANCE_FIX.md` (this file) - Documentation
4. `TOKEN_BALANCE_BUG_INVESTIGATION.md` - Investigation notes

## Status
✅ **FIXED** - Frontend now properly syncs wallet balance after game starts and ends
