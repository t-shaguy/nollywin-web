# Backend Issues Requiring Server-Side Fixes

## ⚠️ Token Not Debited When Starting Game

**Status:** Confirmed backend bug — DO NOT attempt frontend fix

### Problem

Tokens are not being debited from the player's wallet when starting a new game attempt. The tokenBalance remains unchanged on the backend after a full game session.

### Confirmation Method

Tested directly via Postman, bypassing frontend entirely:

1. GET `/api/v1/wallet` → recorded initial tokenBalance (e.g., 51)
2. POST `/api/v1/game/attempts` → started new game attempt
3. Played through entire game session (answered questions, completed/failed)
4. GET `/api/v1/wallet` → tokenBalance unchanged (still 51)

### Root Cause

The backend endpoint that starts a game attempt (`POST /api/v1/game/attempts` or similar) is not executing the token debit logic. This is a backend database/business logic issue, not a frontend refetch timing problem.

### What NOT to Do

❌ **DO NOT** try to "fix" this by:
- Changing when/how the frontend calls `fetchWalletBalance()`
- Adding extra refetch calls after game start
- Implementing optimistic UI updates to subtract tokens manually
- Adding client-side token validation

The underlying tokenBalance value on the server is not changing, regardless of when or how many times the frontend requests it.

### Required Backend Fix

The backend needs to:
1. Identify which endpoint is responsible for starting a game attempt
2. Ensure that endpoint calls the wallet debit function before returning the first question
3. Verify the debit transaction completes successfully in the database
4. Add logging to confirm token debit occurs on every attempt start
5. Consider adding a database constraint or audit log to prevent this from silently failing in the future

### Testing After Backend Fix

Once backend claims this is fixed:
1. Record initial wallet balance via GET `/api/v1/wallet`
2. Start a new game via the Play Trivia flow
3. Verify wallet balance decreased by tokenCostPerPlay immediately (before answering any questions)
4. Test both via Postman (API direct) and via UI (full flow)
5. Confirm frontend `fetchWalletBalance()` in `startGame()` reflects the new lower balance

### Related Files (Frontend - No Changes Needed)

- `app/features/game/presentation/trivia-flow.tsx` - Already calls `fetchWalletBalance()` after `startAttempt()`
- `lib/api/game.ts` - `startAttempt()` calls backend correctly
- `store/wallet-store.ts` - `fetchWalletBalance()` working correctly

### Impact

**User Experience:**
- Players can play unlimited games regardless of token balance
- Token purchases/subscriptions have no functional effect on gameplay limits
- Leaderboards may be exploited by players who realize they have infinite attempts

**Priority:** HIGH — breaks core game economy and monetization

---

## Future Backend Issues

Document additional confirmed backend issues here following the same format:
- Clear problem statement
- Confirmation method (how you know it's backend, not frontend)
- What NOT to do on frontend
- Required backend fix
- Testing verification steps
