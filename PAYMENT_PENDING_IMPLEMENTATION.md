# Payment Pending State Implementation

## Summary

Implemented proper payment pending state handling to prevent users from getting stuck when they close Paystack without paying.

## Changes Made

### 1. Payment State Tracking (`lib/utils/payment-state.ts`)
- Saves `{ packageName, startedAt, reference? }` to localStorage under `nollywin:payment-started`
- Records are cleared when dashboard shows `subscriptionPaymentPending: false` or after 24 hours
- Provides `formatTimeAgo()` helper for displaying relative times

### 2. Unified Subscription Status Label (`hooks/use-subscription-status-label.ts`)
- Single source of truth for status display across top bar, home header, and Store page
- Priority: Payment pending → No plan → No tokens → N tokens → Unlimited
- Returns `{ text, variant, disabled }` for consistent styling

### 3. Store Page Updates (`app/(authenticated)/store/page.tsx`)
- **Payment pending card** (replaces simple text):
  - Shows package name and time ago if saved record exists
  - "Check status" button (invalidates dashboard, 10s cooldown, shows "Still pending" if flag persists)
  - "Start a new payment" button (shows confirm dialog)
- **Plan buttons NOT hard-disabled** when payment pending
- **Confirm dialog** appears when trying to pay with pending payment:
  - Message: "You may already have paid for a plan that is still being confirmed. Check status first."
  - Buttons: "Check status" and "Pay again anyway"
  - Shows backend error message in dialog if payment fails (never raw JSON)
- Airtime flow unchanged (keeps its own banner)

### 4. Subscription Helper Update (`lib/utils/subscription-helpers.ts`)
- `canBuyPlan()` now returns `{ allowed: true }` when payment is pending
- Changed from hard-blocking to allowing UI interaction (dialog handles confirmation)

### 5. Callback Page (`app/payments/callback/page.tsx`)
- **Bounded polling**: Checks dashboard up to 3 times, 3 seconds apart
- **States**:
  - "Confirming your payment..." (checking, shows attempt count)
  - "Payment Confirmed!" (success, plan active, "Go to Home" button)
  - "Still Confirming" (after 3 checks, still pending, "Back to Store" / "Go to Home" buttons)
  - "Payment Cancelled" (no reference or cancelled=true param, clears saved record)
- Clears `payment-started` record on success or cancellation
- No endless polling, no manual verify endpoint calls

### 6. Top Bar Updates (`components/layout/top-bar.tsx`)
- Removed explicit `hasActiveSubscription`, `tokensLeft`, `attemptsResetAt` props
- Now uses `usePlayerDashboard()` and unified status label hook
- Shows "Payment pending" pill with orange styling when applicable
- Consistent with home header and Store page

### 7. Dashboard Header Updates (`app/features/home/presentation/dashboard-header.tsx`)
- Uses unified status label hook
- Shows "Payment pending" button state
- Consistent token display with top bar

### 8. Confirm Dialog Component (`components/ui/confirm-dialog.tsx`)
- New reusable modal for confirmation flows
- Supports custom title, message, button text
- Shows error messages inline (for backend rejection display)
- Loading state for async actions

## Payment Verification Endpoint

**Found**: `GET /api/v1/payments/verify/{reference}` exists in `lib/api/payments.ts`

**Response shape**:
```typescript
{
  reference: string;
  status: "SUCCESS" | "PENDING" | "ABANDONED" | "FAILED";
  amountKobo: number;
  currency: string; // "NGN"
}
```

**Not used in this implementation** - The callback page uses dashboard polling instead of directly calling verify. The verify endpoint is used in the OLD callback page for wallet top-ups but not for subscription purchases.

**Reason**: The dashboard's `subscriptionPaymentPending` flag is the source of truth for subscription status. Polling dashboard (bounded, 3 checks) is simpler and more reliable than trying to verify + match the payment to a subscription.

## Files Checked for Payment Endpoints

- ✅ `lib/api/payments.ts` - Has `verifyPayment(reference)` 
- ✅ `lib/api/subscriptions.ts` - Has `purchasePackage()` but no verify/status endpoint
- ✅ `lib/api/auth.ts` - Has dashboard endpoint (returns `subscriptionPaymentPending`)
- ✅ `lib/api/admin.ts` - No player-facing payment endpoints

## Behavior Summary

### When user closes Paystack without paying:
1. `subscriptionPaymentPending` stays true (backend side effect)
2. User sees payment pending card on Store page
3. User can click "Check status" to refresh (10s cooldown)
4. If still pending, can click "Start a new payment"
5. Confirm dialog warns and offers "Check status" or "Pay again anyway"

### When user completes payment:
1. Paystack redirects to callback page with reference
2. Callback polls dashboard 3 times, 3 seconds apart
3. When `subscriptionPaymentPending` becomes false and plan is active, shows success
4. Clears saved payment-started record

### When backend rejects duplicate payment:
1. Error shown in confirm dialog (e.g., "You already have an active plan")
2. Dialog stays open, user can dismiss
3. No redirect, user sees the error

## Testing Recommendations

1. Start payment → close Paystack → verify card appears with correct package name and time
2. Click "Check status" → verify dashboard refreshes and cooldown activates
3. Click "Start a new payment" → verify dialog appears with warning
4. Click "Pay again anyway" in dialog → verify it proceeds (may fail with backend error)
5. Complete payment → verify callback page shows "Confirming..." then "Payment Confirmed!"
6. Cancel payment at Paystack → verify callback shows "Payment Cancelled"

## Build & Lint Status

✅ Build passes  
✅ Lint clean (no errors)
