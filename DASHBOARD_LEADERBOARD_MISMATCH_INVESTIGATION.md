# Dashboard vs Leaderboard Mismatch Investigation

## Problem
**Dashboard shows**: Total Points: 600, Monthly Rank: #1
**Leaderboard shows**: Player "Tartos" has 350 points, Rank #2

These numbers must agree - can't be #1 on dashboard but #2 with different points on actual leaderboard.

## Data Sources Analysis

### Dashboard Stats (`app/(authenticated)/home/page.tsx`)

**API Endpoint**: `GET /api/v1/dashboard` via `getPlayerDashboard()`

**Fields Used**:
```typescript
const rank = dashboard?.monthlyRank?.rank ?? null;  // Shows as #1
const totalPoints = dashboard?.totalPoints ?? 0;     // Shows as 600
```

**API Response Type** (`lib/api/auth.ts`):
```typescript
export interface PlayerDashboard {
  displayName: string;
  totalPoints: number;           // ← Dashboard "Total Points"
  pointsToday: number;
  tokensLeft: number;
  tokenCostPerPlay: number;
  monthlyRank: {
    rank: number | null;         // ← Dashboard "Monthly Rank"
    participants: number;
    topPercent: number | null;
    periodEndsAt: string;
  } | null;
  // ... other fields
}
```

### Leaderboard Table (`app/(authenticated)/leaderboard/page.tsx`)

**API Endpoint**: `GET /api/v1/game/leaderboard?period=monthly` via `getLeaderboard("monthly")`

**Fields Used**:
```typescript
entries: [
  {
    rank: number,           // Shows as 2
    displayName: string,    // Shows as "Tartos"
    points: number,         // Shows as 350
    // ...
  }
]
```

**API Response Type** (`lib/api/leaderboard.ts`):
```typescript
export interface LeaderboardEntry {
  rank: number;              // ← Leaderboard rank
  authUserId: string;
  displayName: string;
  points: number;            // ← Leaderboard points
  prizeAmount: number;
}
```

## Key Findings

### 1. Different Endpoints
- **Dashboard**: Uses `/api/v1/dashboard` (returns `PlayerDashboard`)
- **Leaderboard**: Uses `/api/v1/game/leaderboard?period=monthly` (returns `LeaderboardResponse`)

### 2. Field Name Ambiguity
- **Dashboard `totalPoints`**: The name "totalPoints" suggests LIFETIME total, but it's displayed as if it represents monthly points
- **Dashboard label**: Component shows "Total Points" with no indication of period (lifetime vs monthly)
- **Leaderboard `points`**: Clearly monthly points (since it's on the monthly leaderboard)

### 3. Possible Causes

#### Scenario A: Dashboard shows LIFETIME points, Leaderboard shows MONTHLY points
If `dashboard.totalPoints = 600` is LIFETIME and `leaderboard.points = 350` is THIS MONTH:
- Player earned 600 total across all time
- Player earned 350 this month
- **Issue**: Dashboard label says "Total Points" but doesn't clarify it's lifetime, making it look like monthly

**Fix**: Change Dashboard label to "**Lifetime Points**" or add monthly points field

#### Scenario B: Dashboard data is stale/cached from before scoring bug fix
If recent trivia games had the scoring bug (wrong-question attribution + total mismatch):
- Old games recorded inflated totals (e.g., showing 100 when only 50 was earned)
- Backend persisted these bad totals in a summary/aggregate field
- Dashboard reads from this stale aggregate (600 includes bad historical data)
- Leaderboard recalculates from raw game attempts and shows correct total (350)

**Fix**: Backend needs to recalculate historical point totals from raw game attempt records

#### Scenario C: Dashboard rank/points from different leaderboard period
If `dashboard.monthlyRank` is from a DIFFERENT month or period:
- monthlyRank might be showing last month's rank (#1) with last month's points (600)
- Current leaderboard shows THIS month's rank (#2) with this month's points (350)

**Fix**: Backend needs to ensure `monthlyRank` matches the CURRENT monthly leaderboard period

#### Scenario D: Race condition - dashboard not refreshed after recent games
If dashboard data is cached/not refreshed:
- Player completed recent games that added points to leaderboard
- Leaderboard API returns fresh data (350 pts, rank #2)
- Dashboard API returns cached/stale data (old rank #1, old points 600)

**Fix**: Add `cache: "no-store"` to dashboard fetch (already done globally) + invalidate dashboard query after games

## Diagnostic Steps

### Step 1: Check if fields represent different periods

Add console logging to both pages:

**Dashboard** (`app/(authenticated)/home/page.tsx`):
```typescript
console.log("[DASHBOARD] Raw response:", dashboard);
console.log("[DASHBOARD] totalPoints:", dashboard?.totalPoints);
console.log("[DASHBOARD] monthlyRank:", dashboard?.monthlyRank);
```

**Leaderboard** (`app/(authenticated)/leaderboard/page.tsx`):
```typescript
console.log("[LEADERBOARD] Raw response:", data);
console.log("[LEADERBOARD] Current user entry:", entries.find(e => e.isCurrentUser));
```

### Step 2: Check API responses in Network tab

1. Open DevTools → Network tab
2. Navigate to Dashboard → Check `GET /api/v1/dashboard` response
3. Navigate to Leaderboard → Check `GET /api/v1/game/leaderboard?period=monthly` response
4. Compare:
   - Does dashboard `totalPoints` (600) match any field on leaderboard?
   - Does dashboard `monthlyRank.rank` (1) match leaderboard `rank` for same user?
   - Does dashboard `monthlyRank.periodEndsAt` match leaderboard `periodEndsAt`?

### Step 3: Check backend data consistency

Contact backend team to verify:
1. What does `dashboard.totalPoints` represent? (Lifetime vs monthly vs current period?)
2. What does `dashboard.monthlyRank.rank` calculate from? (Same data source as leaderboard?)
3. Are historical point totals recalculated or just summed from recorded game sessions?
4. Was there a recent game session for this user with inflated points before the scoring bug fix?

## Hypothesis: Most Likely Scenario

**Scenario B (Stale historical data)** is most likely because:

1. Today we fixed a trivia scoring bug where:
   - Wrong-question attribution recorded points against wrong questions
   - Total didn't match per-question breakdown (showed 100 when should be 50)
2. This bug would have caused some game sessions to record inflated point totals
3. Backend likely has TWO ways of calculating points:
   - **Dashboard**: Reads from a cached/aggregate `player_stats.total_points` field (includes bad historical data = 600)
   - **Leaderboard**: Recalculates from individual `game_attempts` records (correct calculation = 350)
4. The discrepancy (600 vs 350 = 250 points difference) suggests ~2-3 games with inflated totals

## Recommended Actions

### Immediate Frontend Fix (Clarify Labels)

Even if backend data is correct, the Dashboard label is ambiguous:

```typescript
// dashboard-stats.tsx - Change label
{ 
  icon: Star, 
  label: "Total Points",  // ← CHANGE TO "Lifetime Points" or "Monthly Points"
  value: totalPoints.toLocaleString(), 
  // ...
}
```

Ask backend team: Does `dashboard.totalPoints` represent lifetime or monthly?

### Backend Investigation Required

Backend team needs to:

1. **Verify what `totalPoints` represents** in the dashboard endpoint
   - If lifetime: Frontend needs to show "Lifetime Points" label
   - If monthly: Backend needs to fix calculation to match leaderboard

2. **Check if `monthlyRank` comes from same data source as leaderboard**
   - Compare SQL queries for both endpoints
   - Ensure both read from same `game_attempts` table with same filters

3. **Recalculate historical point totals** if scoring bug caused bad persisted data
   - Run a migration/script to recalculate `total_points` from raw `game_attempts`
   - Fix any aggregate/summary tables that cache bad totals

4. **Add data validation** to catch future discrepancies
   - Backend should validate that `dashboard.totalPoints` matches sum of all monthly leaderboard points
   - Log warnings if dashboard rank doesn't match leaderboard rank for same user

## Conclusion

**Status**: 🟡 **NEEDS BACKEND INVESTIGATION**

**Most likely cause**: Dashboard reads from stale aggregate field that includes inflated points from games played before the scoring bug was fixed today. Leaderboard recalculates correctly from raw data.

**Required action**: Backend team needs to:
1. Confirm what `dashboard.totalPoints` represents (lifetime vs monthly)
2. Recalculate historical point totals if they're inflated
3. Ensure dashboard and leaderboard read from consistent data sources

**Frontend action**: Add diagnostic logging to confirm which scenario matches reality, then report findings to backend team.
