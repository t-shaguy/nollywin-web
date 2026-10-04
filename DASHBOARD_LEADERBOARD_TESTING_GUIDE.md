# Dashboard vs Leaderboard Mismatch - Testing Guide

## Issue
Dashboard shows: 600 points, Rank #1
Leaderboard shows: 350 points (player "Tartos"), Rank #2

## Diagnostic Logging Added

### What to Check

1. **Open browser console** (F12 → Console tab)
2. **Navigate to Dashboard** (`/home`)
3. **Look for console logs**:
   ```
   [DASHBOARD DEBUG] Raw response: { ... }
   [DASHBOARD DEBUG] totalPoints: 600
   [DASHBOARD DEBUG] monthlyRank: { rank: 1, participants: X, ... }
   [DASHBOARD DEBUG] displayName: "..."
   ```

4. **Navigate to Leaderboard** (`/leaderboard`)
5. **Look for console logs**:
   ```
   [LEADERBOARD DEBUG] Raw response: { ... }
   [LEADERBOARD DEBUG] periodEndsAt: "..."
   [LEADERBOARD DEBUG] Total entries: X
   [LEADERBOARD DEBUG] Current user entry: { rank: 2, player: "Tartos", points: 350, ... }
   ```

## Network Tab Verification

### Check API Responses

1. Open DevTools → Network tab
2. Clear requests (trash icon)
3. Navigate to Dashboard → Find `GET /api/v1/dashboard`
   - Click on request
   - Go to Response tab
   - Copy entire JSON response

4. Navigate to Leaderboard → Find `GET /api/v1/game/leaderboard?period=monthly`
   - Click on request
   - Go to Response tab
   - Copy entire JSON response

### Compare Responses

**Dashboard Response** should look like:
```json
{
  "displayName": "Tartos",
  "totalPoints": 600,          ← Compare this
  "pointsToday": X,
  "tokensLeft": Y,
  "tokenCostPerPlay": 1,
  "monthlyRank": {
    "rank": 1,                  ← Compare this
    "participants": Z,
    "topPercent": X.X,
    "periodEndsAt": "2026-XX-XXT00:00:00Z"  ← Compare this
  },
  ...
}
```

**Leaderboard Response** should look like:
```json
{
  "periodEndsAt": "2026-XX-XXT00:00:00Z",  ← Should match dashboard?
  "entries": [
    {
      "rank": 1,
      "authUserId": "...",
      "displayName": "SomeOtherPlayer",
      "points": 400,
      ...
    },
    {
      "rank": 2,                           ← Dashboard says rank 1
      "authUserId": "...",
      "displayName": "Tartos",
      "points": 350,                       ← Dashboard says 600
      ...
    }
  ]
}
```

## Key Questions to Answer

### Question 1: Do the periods match?
- **Dashboard `monthlyRank.periodEndsAt`**: `"2026-XX-XXT00:00:00Z"`
- **Leaderboard `periodEndsAt`**: `"2026-XX-XXT00:00:00Z"`
- **Match?** Yes/No

**If NO**: Dashboard is showing rank/points from a DIFFERENT month → Backend bug

### Question 2: Is dashboard totalPoints lifetime or monthly?
- Look at the raw dashboard response
- Check if there's a separate field like `monthlyPoints` or `pointsThisMonth`
- **Dashboard totalPoints**: 600
- **Leaderboard points (for same user)**: 350
- **Difference**: 250 points

**If totalPoints is LIFETIME**: The label "Total Points" is ambiguous → Frontend fix needed (change to "Lifetime Points")

**If totalPoints is MONTHLY**: There's a calculation mismatch → Backend bug (stale aggregate data)

### Question 3: Are we comparing the same user?
- **Dashboard `displayName`**: Should be "Tartos"
- **Leaderboard entry `displayName`**: "Tartos"
- **Leaderboard entry `authUserId`**: (copy this value)
- **Current user ID**: Check console log for `[LEADERBOARD DEBUG] Looking for authUserId: ...`

**If user IDs don't match**: The comparison method is wrong (using email vs userId)

### Question 4: When was the last game played?
Check if recent games might have had the scoring bug:
- The trivia scoring bug was fixed TODAY
- Games played BEFORE today might have recorded inflated points
- If dashboard `totalPoints` includes historical bad data, it would be inflated

## Decision Matrix

### Scenario A: Periods DON'T match
**Evidence**: `dashboard.monthlyRank.periodEndsAt ≠ leaderboard.periodEndsAt`

**Diagnosis**: 🔴 **BACKEND BUG** - Dashboard showing rank/points from wrong period

**Action**: Report to backend team - dashboard endpoint needs to return CURRENT month's rank

---

### Scenario B: Dashboard totalPoints is LIFETIME, leaderboard is MONTHLY
**Evidence**: Dashboard has no `monthlyPoints` field, only `totalPoints`

**Diagnosis**: 🟡 **AMBIGUOUS LABEL** - Dashboard should say "Lifetime Points" not "Total Points"

**Action**: Frontend fix - change label to clarify period

**Fix**:
```typescript
// dashboard-stats.tsx
{ 
  icon: Star, 
  label: "Lifetime Points",  // ← Changed from "Total Points"
  value: totalPoints.toLocaleString(), 
  // ...
}
```

---

### Scenario C: Both are monthly, but numbers don't match
**Evidence**: 
- Periods match
- Dashboard says "monthly" but shows 600
- Leaderboard shows 350 for same user in same period

**Diagnosis**: 🔴 **BACKEND BUG** - Stale/inflated historical data

**Root cause**: Dashboard reads from cached aggregate field that includes inflated points from games played before scoring bug fix

**Action**: Report to backend team - needs to recalculate historical point totals from raw `game_attempts` records

---

### Scenario D: User IDs don't match
**Evidence**: Current user not found in leaderboard, or found but IDs differ

**Diagnosis**: 🟡 **FRONTEND BUG** - Using wrong identifier (email vs authUserId)

**Action**: Fix leaderboard page to use correct user ID for comparison

## Report Format

After testing, provide this information:

```
### Dashboard Response
periodEndsAt: "2026-XX-XXT00:00:00Z"
displayName: "Tartos"
totalPoints: 600
monthlyRank: { rank: 1, participants: X }

### Leaderboard Response
periodEndsAt: "2026-XX-XXT00:00:00Z"
Current user entry: { rank: 2, displayName: "Tartos", points: 350 }

### Comparison
- Periods match: YES/NO
- totalPoints field represents: LIFETIME/MONTHLY/UNKNOWN
- User IDs match: YES/NO
- Point difference: 250 (600 - 350)

### Diagnosis
[A/B/C/D from decision matrix above]

### Required Action
[Frontend fix / Backend fix / Investigation needed]
```

## Next Steps

1. Run the tests above
2. Fill out the report format
3. Determine which scenario (A/B/C/D) matches
4. Take appropriate action:
   - Frontend fix: Update labels or user ID comparison
   - Backend fix: Flag to backend team with specific diagnosis
