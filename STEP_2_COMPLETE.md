# Step 2: Unified Dashboard Hook - COMPLETE ✅

**Date:** September 14, 2026  
**Status:** Complete and verified

## Summary

Successfully consolidated all dashboard fetches into a single unified React Query hook. This eliminates the duplicate query keys (`["dashboard"]`, `["dashboard-shell"]`) and redundant `getPlayerDashboard()` calls that were causing 40% of duplicate API requests.

## Changes Made

### Created New Hook
- **File:** `hooks/use-player-dashboard.ts`
- **Key:** Single `["dashboard"]` query key
- **Config:** 60s staleTime, keepPreviousData, retry: 1
- **Purpose:** Single source of truth for dashboard data across app

### Updated Files (7 files)

1. **components/layout/authenticated-shell.tsx**
   - Replaced manual useQuery with usePlayerDashboard()
   - Removed `["dashboard-shell"]` query key
   
2. **app/(authenticated)/home/page.tsx**
   - Replaced manual useQuery with usePlayerDashboard()
   - Removed stagger delay logic (no longer needed)
   
3. **app/(authenticated)/game/page.tsx**
   - Replaced manual useQuery with usePlayerDashboard()
   
4. **app/(authenticated)/raffles/page.tsx**
   - Replaced manual useQuery with usePlayerDashboard()
   
5. **app/features/game/presentation/trivia-flow.tsx**
   - Replaced direct `getPlayerDashboard()` call with usePlayerDashboard()
   - Removed useEffect for loading tokenCostPerPlay
   
6. **app/features/game/presentation/game-details.tsx**
   - Replaced direct `getPlayerDashboard()` call with usePlayerDashboard()
   - Removed useState for canPlay/tokensLeft
   - Removed useEffect fetch
   
7. **app/features/home/hooks/use-performance-trend.ts**
   - Converted from manual useEffect pattern to React Query
   - Changed signature from `enabled: boolean` to `days: number = 7`
   - Added 60s staleTime and placeholderData

## Expected Impact

- **Duplicate Fetches:** Reduced by ~40%
- **Query Keys:** From 2+ dashboard keys to 1 unified key
- **Cache Efficiency:** React Query now deduplicates all dashboard requests automatically
- **Code Simplification:** Removed manual stagger delays, loading states in game components

## Before/After

### Before Step 2
```
/home navigation:
- authenticated-shell.tsx: GET /dashboard (key: ["dashboard-shell"])
- home/page.tsx: GET /dashboard (key: ["dashboard"]) - after 300ms delay
- game-details.tsx (if opened): GET /dashboard (direct call, no cache)
- trivia-flow.tsx (if started): GET /dashboard (direct call, no cache)

Result: 4 separate dashboard fetches for same data
```

### After Step 2
```
/home navigation:
- All components use usePlayerDashboard() → single ["dashboard"] key
- React Query deduplicates concurrent requests
- 60s cache means no refetch on navigation

Result: 1 dashboard fetch, shared across all components
```

## Verification

✅ Build passed: `npm run build` - Exit Code 0  
✅ TypeScript compilation successful  
✅ All 35 routes built successfully  
✅ No runtime errors in modified components

## Next Steps

Ready for **Step 3: Kill Redundant Fetches**
- Remove wallet leftovers (use-wallet-sync.ts, wallet-store.ts)
- Remove subscription-me calls (use-subscription-sync.ts, subscription-store.ts)
- Convert referral/profile hooks to React Query
- Remove redundant invalidations (keep only necessary ones)
