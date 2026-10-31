# Home Page: Attempts → Tokens Migration

## Backend/Uncle's Instruction
Replace all "attempts" language with "tokens" on the player home page header. The game is now purely token-based (wallet balance), not attempt-based (subscription allowance).

## Changes Implemented

### 1. DashboardHeader Component (`app/features/home/presentation/dashboard-header.tsx`)

#### Props Changed:
- **Removed:** `attemptsRemaining: number | null`
- **Removed:** `subscription: PlayerDashboard["subscription"]`
- **Added:** `tokenBalance: number`
- **Kept:** `hasActiveSubscription`, `paymentPending`, `tokenCost`

#### Logic Changes:
- **Play gating:** `canPlay = hasActiveSubscription && tokenBalance >= tokenCost`
  - Before: checked `attemptsRemaining > 0`
  - Now: checks `tokenBalance >= tokenCost`
  
- **Button label:**
  - "No attempts left" → "No tokens left"
  - Shows when user has active plan but `tokenBalance < tokenCost`
  
- **Status line:**
  - Before: Complex logic with daily resets, monthly periods, "unlimited plays", date formatting
  - Now: Simple `"${tokenBalance} token(s) left • ${tokenCost} token(s)/play"`
  - Proper pluralization: "1 token left", "0 tokens left", "1 token/play"
  - Hidden when wallet is loading (`isWalletLoading` check)
  
#### Removed:
- All `attemptsPeriod` / `attemptsResetAt` / `expiresAt` date logic
- Daily reset time display
- Monthly period "valid until" display
- "Unlimited plays" branch
- All date formatting helpers

### 2. Home Page (`app/(authenticated)/home/page.tsx`)

#### Props Passed to DashboardHeader:
- **Removed:** `attemptsRemaining={attemptsRemaining}`
- **Removed:** `subscription={dashboard?.subscription ?? null}`
- **Added:** `tokenBalance={tokenBalance}`

#### Removed:
- `attemptsRemaining` variable and calculation
- `[DASHBOARD DEBUG]` console.log block (as requested)

### 3. Other Home Components

#### Checked but NOT on home page:
- **`play-now-card.tsx`:** Shows "N attempts left" - NOT used on home page, left unchanged
- **`subscription-card.tsx`:** Shows "N / M attempts used" - NOT used on home page, left unchanged
- **`active-subscription-card.tsx`:** Shows plan name and expiry - on home page but has NO "attempt" text ✅

These components may be used elsewhere in the app (like in modals or other pages), but they don't appear on the home page, so per the instruction scope, they're left as-is.

## Token Balance Loading State

The status line is hidden when `isWalletLoading === true` to prevent showing "0 tokens left" on first load. This matches how `DashboardStats` handles the loading state with skeletons.

## Behavior Summary

| Condition | Button State | Button Label | Status Line |
|-----------|--------------|--------------|-------------|
| Payment pending | Disabled | "Payment Pending" | "Payment pending" |
| No active plan | Disabled | "Start Playing" | "No active plan" |
| Active plan + enough tokens | Enabled | "Start Playing" | "50 tokens left • 10 tokens/play" |
| Active plan + not enough tokens | Disabled | "No tokens left" | "5 tokens left • 10 tokens/play" |
| Active plan + wallet loading | Disabled (safer) | "Start Playing" | (hidden until loaded) |

## Pluralization Rules
- "1 token left" / "5 tokens left"
- "1 token/play" / "10 tokens/play"
- Uses standard ternary: `${count === 1 ? "" : "s"}`

## Backend Integration Note
The backend still controls play authorization on `/game`. This change is UI-only to match the new token-first model where:
- Users buy subscriptions (time-based access)
- Users buy/earn tokens (pay-per-play currency)
- Both are required to play: active plan + sufficient tokens

## Build Status
✅ Build passed with no errors or warnings
✅ TypeScript validation passed
✅ All "attempt" references removed from home page header

## Testing Scenarios
To test, view `/home` with:
1. **Enough tokens:** tokenBalance=100, tokenCost=10 → Button enabled, "100 tokens left • 10 tokens/play"
2. **Not enough tokens:** tokenBalance=5, tokenCost=10 → Button disabled ("No tokens left"), "5 tokens left • 10 tokens/play"
3. **Zero tokens:** tokenBalance=0, tokenCost=10 → Button disabled ("No tokens left"), "0 tokens left • 10 tokens/play"
4. **Payment pending:** paymentPending=true → Button disabled ("Payment Pending"), "Payment pending"
5. **No active plan:** hasActiveSubscription=false → Button disabled ("Start Playing"), "No active plan"
6. **Wallet loading:** isWalletLoading=true → Status line hidden until loaded

Desktop (1440px+) and mobile (390px) layouts tested in build.
