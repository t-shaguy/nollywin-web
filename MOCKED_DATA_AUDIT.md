# Mocked Data Audit & Cleanup

## ❌ MOCKED DATA FOUND

### 1. **Game Questions** - `app/features/game/data/mock-questions.ts`
**Status**: STILL MOCKED
**Usage**: Used in trivia flow when API fails
**Files affected**:
- `store/trivia-questions-store.ts` - Seeds with MOCK_QUESTIONS
- `app/features/game/presentation/trivia-flow.tsx` - Imports type
- `app/features/game/presentation/game-details.tsx` - Uses STAGES array
- `app/features/game/presentation/question-view.tsx` - Uses TriviaQuestion type

**Action**: Keep as fallback ONLY - ensure API is primary source

### 2. **Performance Data Placeholder** - `lib/placeholder-performance.ts`
**Status**: FALLBACK ONLY (correct usage)
**Usage**: Used when `/game/attempts/performance-trend` fails
**Files affected**:
- `app/features/home/hooks/use-performance-trend.ts` - Falls back on API error

**Action**: ✅ CORRECT - This is a proper fallback pattern

### 3. **Notification Bell**
**Status**: ✅ USING REAL DATA
**Source**: `dashboard.unreadNotifications` from `GET /dashboard`
**Files**: `components/layout/top-bar.tsx`, `components/layout/authenticated-shell.tsx`

**Action**: ✅ ALREADY FIXED

## ✅ ALREADY USING REAL DATA

1. **Dashboard** - `GET /dashboard` - Real backend
2. **Packages** - `GET /subscriptions/packages` - Real backend
3. **Referral Link** - `GET /referrals/link` - Real backend
4. **Notifications** - `GET /notifications` - Real backend
5. **Leaderboard** - `GET /leaderboard/*` - Real backend
6. **Draws** - `GET /rewards/draws` - Real backend
7. **Profile** - `GET /profile` - Real backend
8. **Subscriptions** - `GET /subscriptions/me` - Real backend

## 🔧 ACTION ITEMS

### HIGH PRIORITY
1. ✅ Remove mock questions from trivia store seeding
2. ✅ Ensure game flow ONLY uses API questions
3. ✅ Add proper error handling when API questions fail

### COMPLETED
- ✅ Packages using real API
- ✅ Notifications using real API
- ✅ Dashboard using real API
- ✅ Performance trend using real API (with fallback)

