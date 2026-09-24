# Gameplay Type Rewrite + Real Data Wiring - Implementation Status

## ✅ FIXES 1-3 COMPLETE

### FIX 1: Game Types Rewrite ✅
**Status**: Complete - TypeScript passing

**Files Modified:**
- `lib/api/game.ts` - Replaced all types with verified API shapes:
  - `GameQuestion` (flat fields: optionA/B/C/D, no nested options object)
  - `StartAttemptResponse` returns GameQuestion directly (not wrapped)
  - `AttemptState` has status, currentQuestion, summary fields
  - `SubmitAnswerResponse` has correctOption field (only available after submission)
  
**Key Changes:**
- Removed old `Question` interface entirely
- No `correctAnswer` field on question object (doesn't exist in real API)
- `correctOption` only appears in submit answer response

---

### FIX 2: Rework adaptQuestion() and Answer Flow ✅
**Status**: Complete - TypeScript passing

**Files Modified:**
- `app/features/game/presentation/trivia-flow.tsx` - Complete rewrite:
  - `adaptQuestion()` reads flat fields (optionA/B/C/D) from GameQuestion
  - No correctIndex known before answer submission
  - `handleAnswer()` calls submitAnswer() and uses response.correctOption for feedback
  - Uses response.nextQuestion to advance or response.gameOver to end
  - Tracks answersHistory as boolean array for stage-cleared view
  - No code reads correct answer before submitAnswer() returns

**Flow:**
1. Display question from GameQuestion (no correct answer info)
2. Player selects option → call submitAnswer()
3. Use correctOption from response to show feedback
4. Use nextQuestion from response to continue or gameOver to end

---

### FIX 3: Wire Real Subscription Packages ✅
**Status**: Complete - TypeScript passing

**Files Created:**
- `lib/api/subscriptions.ts`:
  - `getAvailablePackages()` → GET /api/v1/subscriptions/packages
  - `purchasePackage(packageId: string)` → POST /api/v1/subscriptions/purchase

**Files Modified:**
- `store/packages-store.ts` - Deleted fake hardcoded packages, fetch from real API
- `app/(authenticated)/store/page.tsx`:
  - Removed `{false && ...}` blocking UI
  - Uses real package UUIDs from API
  - Wires purchasePackage() with real authorizationUrl redirect
  - Shows loading/error states for package fetch

**Real Package Shape:**
```json
{
  "id": "43304781-d4fd-4996-a071-2531c1efeaa6",
  "name": "Daily",
  "durationDays": 1,
  "fee": 100.00,
  "active": true,
  "attemptsIncluded": 1,
  "attemptsPeriod": "DAY"
}
```

---

## ⏳ REMAINING FIXES (4-7)

### FIX 4: Wire Real Raffle History
**TODO:**
- Add `getRaffleHistory()` to raffle API calling GET /api/v1/rewards/draws/history?page=0&size=20
- Wire into raffle history tab (currently no real data source)
- Follow same pattern as existing `getActiveDraws()`

### FIX 5: Wire Real Notifications
**TODO:**
- Create `lib/api/notifications.ts` with 4 functions:
  - `getNotifications(unread?: boolean, page?: number, size?: number)`
  - `getUnreadCount()`
  - `markAsRead(id: string)`
  - `markAllAsRead()`
- Replace `MOCK_NOTIFICATIONS` in `app/(authenticated)/notifications/page.tsx`
- Wire real pagination with entries/page/size/total shape

### FIX 6: Restore Admin Leaderboard Prizes GET
**TODO:**
- Restore `getLeaderboardPrizes()` in `lib/api/admin.ts` (was incorrectly removed)
- Add read-only list section to admin rewards page showing [{rank, prizeAmount}, ...]
- Same visual pattern as read-only Trivia Prizes section

### FIX 7: Fix changeRequestId Type
**TODO:**
- Change `MakerCheckerWriteResponse.changeRequestId` from `number` to `string` in `lib/api/admin.ts`
- Every real response returns UUID string, not number

---

## TypeScript Status After Each Fix

- After FIX 1: ✅ Passing
- After FIX 2: ✅ Passing
- After FIX 3: ✅ Passing
- After FIX 4: Pending
- After FIX 5: Pending
- After FIX 6: Pending
- After FIX 7: Pending

---

## Files Touched Summary

### FIX 1:
- `lib/api/game.ts`
- `app/features/game/presentation/trivia-flow.tsx`

### FIX 2:
- `app/features/game/presentation/trivia-flow.tsx` (complete rewrite)

### FIX 3:
- `lib/api/subscriptions.ts` (created)
- `store/packages-store.ts` (complete rewrite)
- `app/(authenticated)/store/page.tsx` (unblocked UI, wired real purchase)

### FIX 4 (TODO):
- Raffle API file (add getRaffleHistory)
- Raffle history UI tab

### FIX 5 (TODO):
- `lib/api/notifications.ts` (create)
- `app/(authenticated)/notifications/page.tsx` (replace mocks)

### FIX 6 (TODO):
- `lib/api/admin.ts` (restore function)
- `app/admin/rewards/page.tsx` (add read-only list)

### FIX 7 (TODO):
- `lib/api/admin.ts` (change type)

---

## Acceptance Criteria Status

- [x] npx tsc --noEmit passes after FIX 1-3
- [x] No code reads correct answer before submitAnswer()
- [x] Store page shows real packages with real prices
- [x] Store page purchase goes to real Paystack authorizationUrl
- [ ] Notifications page shows real data (not MOCK_NOTIFICATIONS)
- [ ] Raffle history tab has real data source
- [ ] Admin leaderboard prizes restored
- [ ] changeRequestId is string type
- [ ] Final summary lists all files per fix 1-7

---

## Next Steps

Continue with FIXES 4-7 to complete the implementation.
