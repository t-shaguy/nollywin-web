# Step 3: Kill Redundant Fetches - IN PROGRESS

**Date:** September 14, 2026  
**Status:** Partially complete, build passing

## Summary

Removing redundant API fetches and converting manual hooks to React Query to eliminate duplicate requests and reduce backend load.

## Completed Work

### 3.1 Removed Deprecated Wallet/Subscription Sync ✅

**Deleted Files:**
- `hooks/use-wallet-sync.ts` - Wallet API returns 410 Gone (deprecated)
- `hooks/use-subscription-sync.ts` - Dashboard now provides `hasActiveSubscription` and `subscription` details

**Updated Files:**
- `components/layout/authenticated-shell.tsx` - Removed `useSubscriptionSync()` call

**Rationale:** 
- Wallet API (`GET /api/v1/wallet`) returns 410 Gone - endpoint has been deprecated
- Wallet `tokenBalance` was only displayed, never used for logic
- Game tokens are now `tokensLeft` in dashboard (subscription attempts)
- Subscription status is already in dashboard response
- These sync hooks were causing redundant fetches on every page load

### 3.2 Removed Subscription Fetch from Store Page ✅

**Updated:**
- `app/(authenticated)/store/page.tsx` - Now uses `usePlayerDashboard()` to get `subscription.packageName`
- Removed manual `getMySubscriptions("ACTIVE")` call in useEffect
- Removed useState for `currentSubscription`

**Impact:** Eliminates 1 redundant subscription fetch per store page visit

### 3.3 Created React Query Hooks for Referral Data ✅

**Created Files:**
- `hooks/use-referral-link.ts` - Query hook for referral link with 5min cache
- `hooks/use-referral-stats.ts` - Query hook for referral stats with 5min cache

**Configuration:**
- `staleTime: 5 * 60_000` (5 minutes) - referral data changes infrequently
- `retry: 1` - single retry on failure
- Query keys: `["referral", "link"]` and `["referral", "stats"]`

## Remaining Work

### 3.4 Update Referral Page to Use React Query Hooks
- `app/(authenticated)/refer-earn/page.tsx` needs conversion
- Currently uses Zustand `useReferralStore` and manual `fetchReferralData()`
- Need to understand API response structure first

### 3.5 Update Profile/Notifications Pages
- `app/(authenticated)/profile/page.tsx` - Uses `useWalletStore().tokenBalance`
- `app/(authenticated)/notifications/page.tsx` - Uses `useWalletStore().tokenBalance`
- These pages just display tokenBalance - need to either:
  - Remove display (if deprecated)
  - OR find alternative data source (if still needed)

### 3.6 Clean Up Invalidations
- Find all `invalidateQueries(["dashboard-shell"])` calls (should be removed)
- Consolidate game-end invalidations to single `["dashboard"]` call only
- Remove redundant invalidation after subscription purchase

### 3.7 Remove/Simplify Stores
- `store/wallet-store.ts` - Can be deleted (no longer needed)
- `store/subscription-store.ts` - Remove fetching logic, keep types only
- `store/referral-store.ts` - Can be simplified or removed after page conversion

## Build Status
✅ Build passed - Exit Code 0  
✅ TypeScript compilation successful  
✅ All 35 routes built successfully

## Expected Impact (After Completion)

- **Referral Page:** From 2-6 manual fetches to 2 cached queries with deduplication
- **Store Page:** From 2 API calls to 1 (dashboard already fetched)
- **Profile/Notifications:** From wallet fetch on mount to dashboard data (already fetched)
- **Overall:** ~25-30% reduction in redundant API calls

## Next Actions

1. Check referral API response structure
2. Update refer-earn page to use new hooks
3. Update profile/notifications pages (remove wallet balance or find alternative)
4. Clean up invalidation calls
5. Remove/simplify unused stores
6. Verify build and test
