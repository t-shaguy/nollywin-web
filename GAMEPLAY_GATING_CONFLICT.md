# Gameplay Gating Conflict — Attempts vs Tokens

## Issue Confirmed

Two different entry points into gameplay check different conditions, allowing users to bypass the "No attempts left" restriction:

### Entry Point 1: Home Page "Start Playing" Button
**File:** `app/features/home/presentation/play-now-card.tsx`

**Gates on:** `dashboard.attemptsLeft` from `GET /api/v1/dashboard`

**Behavior:**
- Shows "Start Playing" when `attemptsLeft > 0`
- Shows "No attempts left" and disables button when `attemptsLeft === 0`
- User appears completely blocked from playing

### Entry Point 2: Game Details Screen (via Sidebar)
**File:** `app/features/game/presentation/game-details.tsx`

**Gates on:** `currentTokens >= tokenCostPerPlay` ONLY

**Code:**
```typescript
const canPlay = currentTokens >= tokenCostPerPlay;
```

**Behavior:**
- Never checks `attemptsLeft` at all
- Only checks if user has enough tokens
- Allows gameplay as long as tokens are available

## The Problem

A user with `attemptsLeft = 0` but `tokenBalance >= 1`:
1. Sees "No attempts left" disabled button on Home page
2. Can navigate to `/game` via sidebar "Play Trivia" link
3. Successfully plays and gets charged 1 token
4. Two paths disagree on whether user is allowed to play

## Clarification Needed

Before implementing a fix, we need to confirm the intended behavior:

### Option A: Tokens Allow Unlimited Play After Attempts Exhausted
**Interpretation:** Subscription attempts are FREE plays. Once exhausted, users can continue playing by spending tokens (1 token per play).

**If correct, the fix is:**
- Update Home page button to show "Play with 1 token" instead of "No attempts left"
- Change disabled state to only block when BOTH `attemptsLeft === 0` AND `tokenBalance < tokenCostPerPlay`
- This is a UI/copy issue only — backend behavior is already correct

**Files to change:**
- `app/features/home/presentation/play-now-card.tsx` (button state/copy)

### Option B: Attempts Are a Hard Cap Regardless of Tokens
**Interpretation:** `attemptsLeft` is a hard limit on ALL gameplay. Even if user has tokens, they cannot play if attempts are exhausted.

**If correct, the fix is:**
- Add `attemptsLeft` check to `game-details.tsx`
- Block `canPlay` when `attemptsLeft === 0`, even if tokens are available
- This is a logic bug — game-details is missing a critical check

**Files to change:**
- `app/features/game/presentation/game-details.tsx` (add attempts check)
- `app/features/game/presentation/trivia-flow.tsx` (pass attemptsLeft from dashboard)

## Current File States

### play-now-card.tsx
```typescript
// Checks attemptsLeft only
const canPlay = attemptsLeft > 0;
const buttonText = canPlay ? "Start Playing" : "No attempts left";
const buttonDisabled = !canPlay;
```

### game-details.tsx
```typescript
// Checks tokens only, no attemptsLeft check
const canPlay = currentTokens >= tokenCostPerPlay;
```

## Questions for Backend/Product

1. **What is the intended relationship between attempts and tokens?**
   - Are attempts free plays, with tokens as a paid continuation option?
   - Or are attempts a hard cap that tokens cannot bypass?

2. **What should happen when attemptsLeft = 0 but tokenBalance >= tokenCostPerPlay?**
   - Should the user be able to play by spending a token? (Option A)
   - Should the user be completely blocked? (Option B)

3. **Backend behavior question:**
   - When `startAttempt()` is called with `attemptsLeft = 0` but sufficient tokens, does the backend:
     - Debit the token and allow play? (suggests Option A)
     - Return an error blocking play? (suggests Option B)
     - Currently neither (see BACKEND_ISSUES.md — token debit not working)

## Testing Required After Clarification

Whichever option is chosen, test:
1. User with `attemptsLeft = 0`, `tokenBalance = 5`:
   - Home page button state/copy
   - Clicking "Play Trivia" sidebar link
   - Whether game starts successfully
   - Whether token is debited (pending backend fix)

2. User with `attemptsLeft = 2`, `tokenBalance = 0`:
   - Should be able to play (both options agree on this)
   - Should use attempt, not charge token

3. User with `attemptsLeft = 0`, `tokenBalance = 0`:
   - Should be fully blocked (both options agree)
   - Should see message directing to store

## Related Files

- `lib/api/auth.ts` - `getPlayerDashboard()` returns `attemptsLeft` and `tokenCostPerPlay`
- `lib/api/game.ts` - `startAttempt()` endpoint (currently not debiting tokens)
- `BACKEND_ISSUES.md` - Documents confirmed backend token debit bug

## Priority

**HIGH** — This affects core game economy and user experience. Users currently have inconsistent access to gameplay depending on which button they click.

## Status

**AWAITING CLARIFICATION** — Do not implement fix until product/backend confirms intended behavior (Option A or Option B).
