# API Reliability - BASELINE (Before Fixes)

## Measurement Method
Production build (`next build && next start`), Chrome DevTools Network tab (Fetch/XHR filter), logged-in session.

## Expected Issues (Based on Code Analysis)

### Duplicate Query Keys
- Dashboard fetched under 3 keys: `["dashboard"]`, `["dashboard-shell"]`, plus direct calls
- Multiple components fetch same data independently
- No request deduplication

### Redundant Fetches Per Page

| Page | Expected Backend Calls | Issues |
|------|----------------------|---------|
| `/home` | 6-8 | dashboard x2-3, performance-trend, notifications, referrals (if visited profile), subscriptions/me |
| `/raffles` | 5-7 | dashboard x2, draws, history, notifications, subscriptions/me |
| `/store` | 5-6 | dashboard x2, packages, subscriptions/me x2, notifications |
| `/profile` | 7-9 | dashboard x2, profile, referral/link, referral/stats, notifications, subscriptions/me |
| `/refer-earn` | 6-8 | dashboard x2, referral/link, referral/stats, notifications, subscriptions/me |
| `/stats` | 5-7 | dashboard x2, performance-trend, leaderboard, notifications, subscriptions/me |
| `/leaderboard` | 4-6 | dashboard x2, leaderboard data, notifications, subscriptions/me |
| `/game` | 6-8 | dashboard x2-4 (before/during/after), game/start, notifications, subscriptions/me |

### Admin Pages

| Page | Expected Backend Calls | Issues |
|------|----------------------|---------|
| `/admin/overview` | 5-7 | client-token x2-3, dashboard/overview, revenue-trend, recent-activity |
| `/admin/rewards` | 4-6 | client-token x2, draws list, may fetch standings/winners multiple times |

### Cross-Origin Issues
- Every API call is cross-origin (localhost → `http://3.211.19.155`)
- Chrome sends OPTIONS preflight before each request
- No `Access-Control-Max-Age`, so preflight cached ~5 seconds only
- **Effective request count: 2x (OPTIONS + actual request)**

### Known Problems

**Wallet Leftovers (410 errors expected)**:
- `use-wallet-sync.ts` - fetches wallet balance on mount
- `fetchWalletBalance` in wallet store
- Purchase ticket modal
- Payment callback pages

**React Query Issues**:
- `refetchOnWindowFocus: true` globally (before recent fix)
- Performance trend uses custom `useEffect` (no cache)
- Referral data uses Zustand fetch (no React Query)
- Profile refetches after every edit

**API Client Issues**:
- No request deduplication
- No concurrency limit
- Client token refetched on any 401/403/500
- No retry with backoff
- No GET caching

### Estimated Total for One Session
**Conservative estimate**: 40-60 unique backend requests  
**With OPTIONS preflights**: 80-120 total HTTP requests  
**With duplicates**: 100-150+ total requests

### Expected Failures
- CORS errors when backend is slow (Chrome misreports as CORS)
- 500 errors on subscriptions/me, referral endpoints
- 410 errors on wallet endpoints
- Multiple client-token refreshes cascading failures

## After-Fix Targets

| Page | Target Backend Calls | Max |
|------|---------------------|-----|
| `/home` | 3-4 | 4 |
| `/raffles` | 2-3 | 3 |
| `/store` | 2-3 | 3 |
| `/profile` | 2-3 | 3 |
| `/refer-earn` | 2-3 | 3 |
| `/stats` | 2-3 | 3 |
| `/leaderboard` | 2-3 | 3 |
| `/game` | 3-4 | 4 |

**Global improvements**:
- ✅ Same-origin (no CORS, no OPTIONS preflights)
- ✅ Request deduplication (identical requests share promise)
- ✅ Unified dashboard query (one key, shared cache)
- ✅ Remove wallet leftovers (no 410 errors)
- ✅ Remove redundant subscriptions/me calls
- ✅ Convert all fetches to React Query with stable keys
- ✅ Concurrency cap (max 4 in-flight)
- ✅ Retry with backoff for GETs
- ✅ Smart client-token handling

**Expected reduction**: 60-70% fewer requests, near-zero CORS errors, graceful degradation on failures.
