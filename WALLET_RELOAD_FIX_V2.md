# Wallet Balance Not Reloading - Fix V2

## Problem
After completing a trivia game, the token balance in the header still wasn't updating correctly.

## Root Cause Found
In the previous fix, I made `fetchWalletBalance()` awaited at **game start**, but at **game end** it was still fire-and-forget:

```typescript
// handleAnswer() and handleTimeout() - BEFORE FIX
if (response.gameOver || !response.nextQuestion) {
  fetchWalletBalance().catch(console.error);  // ❌ Not awaited!
  // ...
  setTimeout(() => setStep("cleared"), 1500);
}
```

This meant:
1. Game ends
2. Wallet fetch starts (async, not awaited)
3. 1.5 second timer starts immediately
4. Game Over screen appears BEFORE fetch completes
5. Balance might not be updated yet when user sees the screen

## Fix Applied

Changed wallet fetch to be **awaited** at game end:

### handleAnswer() - After last question
```typescript
if (response.gameOver || !response.nextQuestion) {
  // Log summary first
  if (response.summary) {
    console.log("Game summary:", response.summary);
  }
  
  // AWAIT wallet balance fetch to ensure it completes
  try {
    await fetchWalletBalance();
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  } catch (err) {
    console.error("[TRIVIA] Failed to refresh wallet balance after game end:", err);
  }
  
  // THEN show game over screen
  setTimeout(() => {
    setStep("cleared");
  }, 1500);
}
```

### handleTimeout() - After timeout on last question
```typescript
if (response.gameOver || !response.nextQuestion) {
  // Log summary first
  if (response.summary) {
    console.log("Game summary:", response.summary);
  }
  
  // AWAIT wallet balance fetch to ensure it completes
  try {
    await fetchWalletBalance();
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  } catch (err) {
    console.error("[TRIVIA] Failed to refresh wallet balance after timeout:", err);
  }
  
  // THEN show game over screen
  setTimeout(() => {
    setStep("cleared");
  }, 1500);
}
```

## How It Works Now

### Game Start Flow:
1. User clicks "Start Game"
2. `POST /api/v1/game/attempts` → Backend deducts 1 token
3. **AWAIT** `fetchWalletBalance()` → Get fresh balance
4. Header updates to show new balance (e.g., 58 → 57)
5. First question appears

### Game End Flow:
1. User answers/times out on last question
2. `POST /api/v1/game/attempts/{id}/answer` → Game completes
3. Log game summary
4. **AWAIT** `fetchWalletBalance()` → Ensure balance is fresh
5. Wait 1.5 seconds
6. Show Game Over screen with correct balance in header

### Additional Backup:
The Game Over screen (`StageCleared` component) also fetches balance on mount as a defensive measure:

```typescript
useEffect(() => {
  fetchWalletBalance().catch((err) => {
    console.error("Failed to refresh wallet balance on Game Over screen:", err);
  });
}, []);
```

## All Fetch Points Summary

The wallet balance is now fetched at:
1. ✅ **Game start** - Awaited, ensures header updates before first question
2. ✅ **Game end (answer)** - Awaited, ensures balance fresh before Game Over screen
3. ✅ **Game end (timeout)** - Awaited, ensures balance fresh before Game Over screen
4. ✅ **Game Over screen mount** - Fire-and-forget backup, catches edge cases

## Console Logs to Verify

After this fix, you should see in console:

**After clicking "Start Game":**
```
[WALLET FETCH] Starting balance fetch...
[WALLET FETCH] API returned tokenBalance: 57
[WALLET FETCH] Zustand store updated with balance: 57
```

**After game ends:**
```
Game summary: {...}
[WALLET FETCH] Starting balance fetch...
[WALLET FETCH] API returned tokenBalance: 57
[WALLET FETCH] Zustand store updated with balance: 57
```

**On Game Over screen:**
```
[WALLET FETCH] Starting balance fetch...
[WALLET FETCH] API returned tokenBalance: 57
[WALLET FETCH] Zustand store updated with balance: 57
```

## Expected Behavior

- **Before game**: Header shows 58 tokens
- **After clicking "Start Game"**: Header immediately shows 57 tokens (before Q1 appears)
- **During game**: Header stays at 57 tokens
- **On Game Over screen**: Header still shows 57 tokens
- **After "Play Again"**: Header shows 56 tokens (before Q1 of new game)

## If Balance Still Doesn't Update

Check console for these error patterns:

### Error Pattern 1: API Errors
```
[WALLET FETCH] Failed to fetch wallet balance: ApiError: ...
```
**Cause**: Backend API issue or network error
**Solution**: Check backend server status, verify `/api/v1/wallet` endpoint works

### Error Pattern 2: Cache Still Active (Unlikely after cache: "no-store" fix)
```
[WALLET FETCH] API returned tokenBalance: 58  ← Same old value
```
**Cause**: Browser still caching despite `cache: "no-store"`
**Solution**: Hard refresh (Ctrl+Shift+R), clear browser cache completely

### Error Pattern 3: No Logs Appearing
```
(No wallet fetch logs at all)
```
**Cause**: `fetchWalletBalance()` not being called
**Solution**: Check if errors are preventing the code from reaching the fetch call

## Files Modified

1. ✅ `app/features/game/presentation/trivia-flow.tsx` 
   - Made wallet fetch awaited at game end (both handleAnswer and handleTimeout)
   - Better error logging with [TRIVIA] prefix

## Combined with Previous Fixes

This fix builds on previous improvements:
1. **HTTP Cache Fix**: Added `cache: "no-store"` to all API calls (prevents browser caching)
2. **Await at Game Start**: Made wallet fetch awaited when game starts
3. **Game Over Backup**: Added wallet fetch on Game Over screen mount
4. **Now: Await at Game End**: Made wallet fetch awaited when game ends ✅

All four layers ensure the balance is always fresh and displayed correctly.
