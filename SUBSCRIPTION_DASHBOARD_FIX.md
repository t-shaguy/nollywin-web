# Subscription/Attempts Display Fix - Real Dashboard Fields

## Overview
Updated all subscription and attempts display logic to use real dashboard API fields instead of hardcoded assumptions. Plans are now admin-configurable with flexible attempt periods (DAY vs MONTH), and the UI adapts to show the correct messaging based on the actual backend configuration.

## Problem
The app was hardcoding plan descriptions like "7 attempts/month" or "3 attempts/day" based on plan names, and checking `subscription === null` to determine if a user had an active plan. This broke when:
- Backend made plans admin-configurable (attempt counts/periods can change)
- Backend added `subscriptionPaymentPending` state for the 30-minute window between checkout and confirmation
- Backend added `attemptsPeriod` and `attemptsResetAt` fields to support both daily-reset and monthly-pool models

## Solution
Use the real dashboard fields returned by `GET /api/v1/dashboard`:

### New Dashboard Fields
```typescript
interface PlayerDashboard {
  hasActiveSubscription: boolean; // Use this instead of null-checking subscription
  subscriptionPaymentPending: boolean; // True for 30min after checkout starts
  subscription: {
    packageName: string;
    expiresAt: string;
    attemptsPeriod: "DAY" | "MONTH"; // Admin-configurable
    attemptsResetAt: string | null; // Next reset (only for DAY period, null for MONTH)
    attemptsIncluded: number | null; // null for pure time-based plans
    attemptsUsed: number | null;
    attemptsRemaining: number | null;
  } | null;
}
```

### Key Behavioral Changes

#### 1. Attempt Period Display Logic
**DAY Period (Daily Resets):**
- Show: "X attempts left today, resets at [time]"
- Uses `attemptsResetAt` field for reset time
- Example: "5 attempts left today, resets at 12:00 AM"

**MONTH Period (Fixed Pool):**
- Show: "X attempts left this period, valid until [date]"
- Uses `expiresAt` field (no daily reset)
- Example: "5 attempts left this period, valid until Dec 31"

**No Attempt Limit (Time-Based Access):**
- When `attemptsRemaining === null`
- Show: "Unlimited plays • X tokens/play"

#### 2. Payment Pending State
- `subscriptionPaymentPending: true` for 30 minutes after subscription checkout
- Shows yellow "Payment Pending" banner instead of "No plan"
- Clock icon instead of Star icon
- Message: "Your subscription payment is being processed. This usually takes a few minutes."

#### 3. Subscription Status Check
- Use `hasActiveSubscription` boolean (not `subscription === null`)
- Handles edge case where subscription object exists but is expired

## Files Modified

### 1. `lib/api/auth.ts`
**Updated `PlayerDashboard` interface:**
- Added `hasActiveSubscription: boolean`
- Added `subscriptionPaymentPending: boolean`
- Replaced generic `subscription: Record<string, unknown> | null` with typed object
- Added `attemptsPeriod`, `attemptsResetAt`, `attemptsIncluded`, `attemptsUsed`, `attemptsRemaining`
- Removed `freeAttemptsLeft` (replaced by `subscription.attemptsRemaining`)

### 2. `app/(authenticated)/home/page.tsx`
**Changed from:**
- Reading `dashboard.freeAttemptsLeft`
- Passing `attemptsLeft` to components

**Changed to:**
- Reading `hasActiveSubscription`, `subscriptionPaymentPending`, `subscription.attemptsRemaining`
- Passing full subscription object to components for flexible display

### 3. `app/features/home/presentation/dashboard-header.tsx`
**Changed from:**
- Props: `attemptsLeft: number`, `tokenCost: number`
- Static text: "X attempts left • Y tokens/play"

**Changed to:**
- Props: `hasActiveSubscription`, `paymentPending`, `attemptsRemaining`, `tokenCost`, `subscription`
- Dynamic text based on `attemptsPeriod`:
  - DAY: "X attempts left today, resets at [time]"
  - MONTH: "X attempts left this period, valid until [date]"
  - No limit: "Unlimited plays • Y tokens/play"
  - Payment pending: "Payment pending"
  - No plan: "No active plan"

### 4. `app/features/home/presentation/active-subscription-card.tsx`
**Changed from:**
- Using `useSubscriptionStore()` Zustand store
- Props: none (read from store)

**Changed to:**
- Props: `hasActiveSubscription`, `paymentPending`, `subscription`
- Shows "Payment Pending" with Clock icon when payment is processing
- Shows plan name and expiry date from real dashboard subscription object

### 5. `app/(authenticated)/game/page.tsx`
**Changed from:**
- Checking `useSubscriptionStore().hasActivePlan`

**Changed to:**
- Querying dashboard API directly
- Checking `hasActiveSubscription` and `subscriptionPaymentPending`
- Passing `paymentPending` prop to banner

### 6. `components/ui/subscription-banner.tsx`
**Added:**
- `paymentPending` prop
- Yellow banner variant with Clock icon for payment pending state
- Message: "Your subscription payment is being processed..."

### 7. `app/(authenticated)/store/page.tsx`
**Already correct:**
- Reads packages from `GET /api/v1/subscriptions/packages`
- Displays `plan.attemptsIncluded` and `plan.attemptsPeriod` dynamically
- No hardcoded "7 attempts/month" text

## Store Page Package Display
The store page already pulls from the live packages API and displays:
- `plan.name` - Admin-configured package name
- `plan.attemptsIncluded` - Admin-configured attempt count
- `plan.attemptsPeriod` - Admin-configured period (DAY/MONTH)
- `plan.durationDays` - Admin-configured duration
- `plan.fee` - Admin-configured price

Example display: "7 attempts / month" or "3 attempts / day" based on real backend config.

## Testing Scenarios

### Scenario 1: Daily Reset Plan
**Backend returns:**
```json
{
  "hasActiveSubscription": true,
  "subscription": {
    "packageName": "Daily Pass",
    "attemptsPeriod": "DAY",
    "attemptsResetAt": "2026-09-15T00:00:00Z",
    "attemptsRemaining": 3,
    "expiresAt": "2026-09-15T23:59:59Z"
  }
}
```
**UI shows:** "3 attempts left today, resets at 12:00 AM • 1 token/play"

### Scenario 2: Monthly Pool Plan
**Backend returns:**
```json
{
  "hasActiveSubscription": true,
  "subscription": {
    "packageName": "Monthly Pass",
    "attemptsPeriod": "MONTH",
    "attemptsResetAt": null,
    "attemptsRemaining": 15,
    "expiresAt": "2026-10-14T23:59:59Z"
  }
}
```
**UI shows:** "15 attempts left this period, valid until Oct 14 • 1 token/play"

### Scenario 3: Payment Pending
**Backend returns:**
```json
{
  "hasActiveSubscription": false,
  "subscriptionPaymentPending": true,
  "subscription": null
}
```
**UI shows:** 
- Header: "Payment Pending" button (disabled, with Clock icon)
- Card: "Payment Pending" with "Confirming your subscription..."
- Game page: Yellow banner with payment pending message

### Scenario 4: No Attempt Limit (Time-Based)
**Backend returns:**
```json
{
  "hasActiveSubscription": true,
  "subscription": {
    "packageName": "Premium Pass",
    "attemptsPeriod": "MONTH",
    "attemptsRemaining": null,
    "attemptsIncluded": null,
    "expiresAt": "2026-12-31T23:59:59Z"
  }
}
```
**UI shows:** "Unlimited plays • 1 token/play"

### Scenario 5: No Active Plan
**Backend returns:**
```json
{
  "hasActiveSubscription": false,
  "subscriptionPaymentPending": false,
  "subscription": null
}
```
**UI shows:**
- Header: "No active plan"
- Card: "No active plan" with "Choose a Plan" link
- Game page: Red banner with "Active Subscription Required"

## Benefits
1. ✅ No hardcoded plan descriptions - all data from API
2. ✅ Supports admin-configurable plan structures
3. ✅ Handles payment pending state properly
4. ✅ Shows correct reset messaging (daily vs monthly)
5. ✅ Supports pure time-based plans with no attempt limits
6. ✅ Uses proper boolean flags instead of null checks
7. ✅ Consistent messaging across dashboard, game page, and store

## Migration Notes
- The old `freeAttemptsLeft` field is removed - use `subscription.attemptsRemaining` instead
- The old `useSubscriptionStore()` is no longer used for dashboard display (but may still be used elsewhere)
- Components now receive dashboard data as props instead of reading from Zustand
- All time display uses `toLocaleTimeString()` and `toLocaleDateString()` for proper formatting

## Backend Dependencies
This implementation assumes the backend returns the fields documented in the updated `PlayerDashboard` interface. If the backend hasn't implemented these fields yet, the UI will gracefully fall back to showing "No active plan" until the fields are available.
