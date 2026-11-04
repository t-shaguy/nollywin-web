# One-Active-Plan Rule Implementation

## Overview
Enforced the one-active-plan rule on the Store page: players can only buy a new plan when they have NO active plan, their plan is used up (tokensLeft === 0), or their plan is expired.

## Business Rules (Backend/Product Decision)

### Can Buy When:
- ✅ No active plan (`hasActiveSubscription === false`)
- ✅ Active plan with 0 plays left (`hasActiveSubscription === true` AND `tokensLeft === 0`)
- ✅ Active plan expired (no longer reflected in dashboard as active)

### Cannot Buy When:
- ❌ Payment pending (`subscriptionPaymentPending === true`)
- ❌ Active plan with plays left (`hasActiveSubscription === true` AND `tokensLeft > 0`)
- ❌ Active unlimited plan (`hasActiveSubscription === true` AND `tokensLeft === null`)

### Key Principles:
1. **Source of truth**: Dashboard only (`GET /api/v1/dashboard`)
   - Do NOT use `/subscriptions/me` (mislabels expired plans as ACTIVE)
2. **No pooling**: Dashboard shows only ONE active plan
3. **Plan ends**: When plays run out OR time expires (whichever comes first)

## Implementation

### 1. Helper Functions (`lib/utils/subscription-helpers.ts`)

#### `canBuyPlan(dashboard)` → `{ allowed: boolean, reason?: string }`
Determines if user can purchase a new plan based on dashboard state.

```typescript
// Payment pending
{ allowed: false, reason: "Your payment is still being confirmed." }

// Active unlimited plan
{ allowed: false, reason: "You have an active Premium plan with unlimited plays." }

// Active plan with plays left
{ allowed: false, reason: "You have 5 plays remaining in your Weekly plan." }

// Can buy (no plan or used up)
{ allowed: true }
```

#### `formatPlanAllowance(pkg)` → string
Formats plan details for display. **One-line change later** if backend confirms null = unlimited.

```typescript
// With play limit
"50 plays or 30 days, whichever comes first"

// Without play limit (null attemptsIncluded)
"30 days" // Does NOT claim "Unlimited" (not confirmed by backend)
```

#### `formatExpiryDate(isoDate)` → string
Formats date as `DD MMM YYYY` in Africa/Lagos timezone.

```typescript
formatExpiryDate("2026-12-31T23:59:59Z") // "31 Dec 2026"
```

### 2. Store Page Changes (`app/(authenticated)/store/page.tsx`)

#### A. Current Plan Card (When NOT Allowed)
Shows at top of page when `canBuy === false`:

```tsx
┌─────────────────────────────────────────┐
│ Your Current Plan                       │
│                                         │
│ Plan:        Weekly Plan               │
│ Plays Left:  5 plays                   │
│ Expires:     15 Dec 2026               │
│                                         │
│ You can buy another plan once you've   │
│ used all your plays or this plan       │
│ expires.                               │
└─────────────────────────────────────────┘
```

#### B. Used Up Plan Note (When Allowed But 0 Plays)
Shows when `canBuy === true` AND `tokensLeft === 0`:

```tsx
┌─────────────────────────────────────────┐
│ ℹ️ You've used all plays in your       │
│   Weekly Plan plan.                     │
└─────────────────────────────────────────┘
```

#### C. Backend Error Display (4xx Rejection)
Shows when backend rejects purchase attempt:

```tsx
┌─────────────────────────────────────────┐
│ ⚠️ You cannot purchase a subscription   │
│   while another is active.              │
└─────────────────────────────────────────┘
```

#### D. Plan Cards Disabled State
When `canBuy === false`:
- ❌ Button disabled (greyed out, not clickable)
- ❌ No hover effect
- ❌ `disabled` + `aria-disabled` attributes
- 📝 Label: "Current plan active"
- 🔒 onClick blocked

#### E. Plan Card Display Format
```tsx
┌─────────────────────────────────────────┐
│ Weekly Plan      [Best value]          │
│ 50 plays or 7 days, whichever comes   │
│ first                                  │
│                          ₦2,000        │
└─────────────────────────────────────────┘
```

**Changes:**
- Removed "tokens / period" wording
- Removed "Unlimited plays" claim (not confirmed)
- Removed "Extend Plan" wording
- Shows duration only when `attemptsIncluded === null`
- Uses ₦ with thousands separators

### 3. Checkout View Guard

Re-checks `canBuyPlan()` before submitting payment:

```typescript
const handleConfirmPayment = async () => {
  // Guard: re-check if user can still buy (stale page, another tab)
  const recheckBuy = canBuyPlan(dashboard);
  if (!recheckBuy.allowed) {
    setBackendError(recheckBuy.reason || "...");
    setView("browse");
    return;
  }
  // ... proceed with purchase
};
```

### 4. Backend Rejection Handling

Catches 4xx responses from `POST /api/v1/subscriptions/purchase`:

```typescript
try {
  const response = await purchasePackage({ packageId: selected.id });
  // ... redirect to Paystack
} catch (error: any) {
  // Show backend message
  setBackendError(error.message || "Payment failed. Please try again.");
  
  // Refresh dashboard to get latest state
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  
  // Return to browse view
  setView("browse");
  setSelected(null);
}
```

### 5. Dashboard Header Update (`app/features/home/presentation/dashboard-header.tsx`)

Added "Buy a new plan" link when `tokensLeft === 0`:

```tsx
{noTokensLeft && (
  <Link href="/store" className="text-xs text-primary hover:underline mt-0.5">
    Buy a new plan
  </Link>
)}
```

**States:**
- No plan → "Get a Plan" button + "Browse plans" link
- 0 tokens → "No tokens left" button (disabled) + **"Buy a new plan" link**
- Has tokens → "Start Playing" button (enabled)
- Unlimited → "Start Playing" button (enabled)
- Payment pending → "Payment Pending" button (disabled)

### 6. Query Invalidation

Dashboard and draws queries are invalidated:
- ✅ After successful payment (callback page)
- ✅ Before redirecting to Paystack
- ✅ After backend rejection (to refresh state)

## UI States & Test Cases

### 1. No Plan
```
✅ All plan buttons: ENABLED
✅ Can select and purchase
✅ No current plan card shown
✅ No used up note shown
```

### 2. Active Plan with Plays Left (e.g., 5 plays)
```
❌ All plan buttons: DISABLED (greyed out)
❌ Label: "Current plan active"
❌ No hover effect
✅ Current plan card shown at top:
   - Plan: Weekly Plan
   - Plays Left: 5 plays
   - Expires: 15 Dec 2026
   - Message: "You can buy another plan once you've used all your plays or this plan expires."
❌ Cannot click plan cards
❌ Cannot proceed to checkout
```

### 3. Active Plan with 0 Plays Left
```
✅ All plan buttons: ENABLED
✅ Can select and purchase
✅ Blue note shown: "You've used all plays in your Weekly Plan plan."
❌ No current plan card shown (plan is used up)
```

### 4. Unlimited Plan
```
❌ All plan buttons: DISABLED (greyed out)
❌ Label: "Current plan active"
✅ Current plan card shown:
   - Plan: Premium Plan
   - Plays Left: Unlimited
   - Expires: 31 Dec 2026
   - Message: "You can buy another plan once you've used all your plays or this plan expires."
```

### 5. Payment Pending
```
❌ All plan buttons: DISABLED (greyed out)
❌ Label: "Current plan active"
✅ Current plan card shown with:
   - Red error message: "Your payment is still being confirmed."
```

### 6. Backend Rejection (4xx)
```
✅ Error displayed at top: "You cannot purchase a subscription while another is active."
✅ Dashboard refreshed
✅ Returns to browse view
❌ Does NOT redirect to Paystack
```

### 7. Stale Page / Another Tab
```
User opens store → opens another tab → purchases → returns to first tab → tries to buy again
✅ Checkout guard blocks purchase
✅ Shows error: "You have 30 plays remaining in your Monthly plan."
✅ Returns to browse view
```

## Edge Cases Handled

1. **Dashboard not loaded yet** (`dashboard === undefined`)
   - Allow UI to show (don't block)
   - Buttons enabled (no premature blocking)

2. **Expired plan** 
   - Not reflected in dashboard (hasActiveSubscription === false)
   - Treated as "no plan" → can buy

3. **Plan expires while on Store page**
   - Dashboard query has staleTime (1 min)
   - May show as active for up to 1 minute
   - Backend will reject if truly expired
   - Error handler refreshes dashboard

4. **Multiple tabs**
   - User buys plan in Tab A
   - Tab B still shows old state
   - Checkout guard in Tab B blocks purchase
   - Shows error message

5. **Backend rule changes**
   - UI already blocks, but backend is source of truth
   - If backend adds new rejection reason, error is shown
   - Dashboard refreshed to sync state

## Data Flow

```
User Action → Check canBuyPlan(dashboard)
                │
                ├─ allowed: false
                │   └─> Show current plan card
                │       Disable all buttons
                │       Show reason message
                │
                └─ allowed: true
                    └─> Enable plan buttons
                        ├─ hasUsedUpPlan: true
                        │   └─> Show used up note
                        │
                        └─> User selects plan
                            └─> Checkout
                                └─> Re-check canBuyPlan
                                    ├─ allowed: false → block
                                    └─> POST /purchase
                                        ├─ 2xx → redirect Paystack
                                        └─ 4xx → show error + refresh
```

## Files Modified

1. **Created:**
   - `lib/utils/subscription-helpers.ts` - Helper functions

2. **Modified:**
   - `app/(authenticated)/store/page.tsx` - Main enforcement logic
   - `app/features/home/presentation/dashboard-header.tsx` - "Buy a new plan" link

3. **Already Correct:**
   - `app/payments/callback/page.tsx` - Dashboard invalidation on success

## Verification Checklist

- [x] No plan → buttons enabled
- [x] Active plan with 5 plays → buttons disabled, current plan card shown
- [x] Active plan with 0 plays → buttons enabled, used up note shown
- [x] Unlimited plan → buttons disabled, current plan card shown
- [x] Payment pending → buttons disabled, payment message shown
- [x] Backend 4xx → error shown, dashboard refreshed, no redirect
- [x] Checkout guard → blocks if state changed
- [x] Dashboard header → "Buy a new plan" link when tokensLeft === 0
- [x] Plan card format → "{n} play(s) or {d} day(s), whichever comes first"
- [x] No "Unlimited" claim when attemptsIncluded === null
- [x] Price format → ₦ with thousands separators
- [x] Expiry date → DD MMM YYYY in Africa/Lagos
- [x] Build passes ✅

## Future Maintenance

### When Backend Confirms Null = Unlimited

Change one line in `formatPlanAllowance()`:

```typescript
if (pkg.attemptsIncluded === null) {
  return "Unlimited plays"; // ← Change this line
}
```

### When Backend Changes Rules

Update `canBuyPlan()` logic in `lib/utils/subscription-helpers.ts`:
```typescript
export function canBuyPlan(dashboard: PlayerDashboard | undefined | null): CanBuyPlanResult {
  // Add new rules here
}
```

UI will automatically adapt to new rules.

---

**Status**: ✅ Complete
**Build**: ✅ Passing
**Ready**: For production testing
