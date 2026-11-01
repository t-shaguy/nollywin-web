# V37 Implementation Status

## Completed ✅

### 1. API Type Updates
- ✅ Updated `PlayerDashboard` interface in `lib/api/auth.ts`
  - Added `canPlay: boolean`
  - Changed `tokensLeft` to `number | null` (0 = no plan, null = unlimited)
  - Updated `activeRaffles` to v37 schema (raffleCode, startsOn, endsOn, drawDate, myPoints)
- ✅ Updated `RaffleDraw` interface in `lib/api/leaderboard.ts`
  - Added v37 fields: raffleCode, startsOn, endsOn, drawDate, prizeTiers
  - Made ticketCostTokens optional (legacy)
- ✅ Updated `RaffleHistoryEntry` interface
  - Added v37 fields: raffleCode, drawDate, wonTier, wonPrize, myPoints
  - Made legacy fields optional

### 2. Helper Utilities
- ✅ Created `lib/utils/draw-countdown.ts`
  - `getDrawCountdown(drawDate)` - calculates human-readable countdown
  - `formatDateRange(startsOn, endsOn)` - formats date ranges
  - `formatDrawDate(dateStr)` - formats single dates
  - Uses Africa/Lagos timezone

### 3. Player Home Page
- ✅ Updated `dashboard-header.tsx`
  - Now uses `canPlay` prop from dashboard
  - Shows `tokensLeft` (with null = "Unlimited")
  - "Get a Plan" button when no subscription
  - "No tokens left" state
  - Removed wallet balance usage
  - Removed token cost per play display
- ✅ Updated `home/page.tsx`
  - Removed `useWalletStore` import
  - Pass dashboard's `canPlay`, `tokensLeft` to header
- ✅ Updated `dashboard-stats.tsx`
  - Handle `tokensLeft: number | null` properly
  - Display "Unlimited" for null

### 4. Top Bar
- ✅ Updated `components/layout/top-bar.tsx`
  - Changed from `tokenBalance` to `tokensLeft` + `hasActiveSubscription` props
  - Show "Subscribe" button when no active plan
  - Handle null tokensLeft ("Unlimited")

## In Progress 🚧

### 5. Authenticated Shell
- ⏳ Need to update `components/layout/authenticated-shell.tsx`
  - Fetch dashboard data here or receive as props
  - Pass `tokensLeft` and `hasActiveSubscription` to TopBar
  - Remove wallet sync hook (wallet is read-only now)

## Remaining Work 📋

### 6. Player Store Page (Remove Wallet Top-Up)
- 📝 Update `app/(authenticated)/store/page.tsx`
  - Remove token package cards
  - Remove wallet top-up flow
  - Keep only subscription packages
  - Remove exchange rate display
  - Keep `POST /api/v1/subscriptions/purchase` flow
- 📝 Remove from `lib/api/payments.ts` or equivalent:
  - `POST /api/v1/wallet/topup` function (if exists)
  - `POST /api/v1/payments/initiate` with `WALLET_TOPUP` purpose
- 📝 Remove from `lib/api/wallet.ts`:
  - Any topup-related functions

### 7. Player Draws & Rewards Page (Points-Based)
- 📝 Update `app/(authenticated)/raffles/page.tsx`
  - Rename "My Entries" tab → "History"
  - Show qualifying message when no active plan
- 📝 Rewrite `app/features/raffles/presentation/active-draw-card.tsx`
  - Remove all ticket references
  - Show: prize name, raffle code, qualifying period, draw date, user points
  - Show prize tiers if present
  - Add draw countdown chip
  - Show "Need active plan" message if no subscription
  - Add "How it works" explanation line
- 📝 Create draw countdown popup component
  - Modal with draw countdown, dates, user points
  - "Got it" button
  - Auto-show once per session for nearest draw
  - Store "seen" flag in sessionStorage
  - Respect prefers-reduced-motion
- 📝 Update `app/features/raffles/presentation/raffle-history-list.tsx`
  - Use raffleCode, drawDate
  - Show wonTier + wonPrize if won
  - Show "Not a winner this time" if didn't win

### 8. Game Start Flow (402 Handling)
- 📝 Update game start logic to handle HTTP 402
  - Show friendly message
  - "Get a plan" action
  - Don't show raw error
- 📝 After game finishes, refresh dashboard
  - Update tokensLeft
  - Update draw points (myPoints)

### 9. Admin Draws (Complete Rewrite)
- 📝 Rewrite `app/admin/rewards/page.tsx`
  - Create draw form with v37 fields
  - Prize tiers repeater
  - Validation (endsOn >= startsOn, drawDate after endsOn, etc.)
  - Handle 202 response (pending approval)
  - List view with raffleCode, period, drawDate
  - Detail view with standings and winners
  - Action matrix (Close, Select Winners)
- 📝 Update `lib/api/admin.ts`
  - Add v37 draw CRUD functions
  - Add standings endpoint
  - Add winners endpoint
  - Update types

### 10. Admin Change Requests (Checker Flow)
- 📝 Verify checker can approve draw creation
  - Show `approvalNote` field
  - Show resource type `RaffleDraw`
  - Handle 403 gracefully

### 11. Admin Reports
- 📝 Update Reports > Raffles
  - Add raffleCode, startsOn, endsOn, drawDate columns
  - Update CSV export

### 12. Cleanup (Grep and Remove)
- 📝 Grep and remove all references to:
  - `buy-ticket` / `buyTicket` / `BuyTicket`
  - `POST /api/v1/wallet/topup`
  - `POST /api/v1/payments/initiate` with `WALLET_TOPUP`
  - `ticketCostTokens` usage in UI
  - "attempts left" in user-facing text
  - Wallet balance usage for play gating
  - `useWalletStore` for tokenBalance in play decisions

### 13. Components to Update (Attempts → Tokens)
- 📝 `app/features/home/presentation/play-now-card.tsx`
  - Check if used on home page
  - Change "attempts" to "tokens" if relevant
- 📝 `app/features/home/presentation/subscription-card.tsx`
  - Check if used on home page
  - Clarify subscription vs play tokens

### 14. Build & Test
- 📝 Build with no TS/lint errors
- 📝 Test player with active subscription (home, draws, game start)
- 📝 Test player with no plan (disabled state, "Get a plan")
- 📝 Test admin (create single/tiered draw, approve, list, detail, standings, winners)
- 📝 Screenshots at 1440px and 390px
- 📝 Final grep to confirm no remaining dead code

## Notes

### API Endpoints Status (v37)
**Retired (410 Gone):**
- `POST /api/v1/wallet/topup`
- `POST /api/v1/payments/initiate` with `purpose: "WALLET_TOPUP"`
- `POST /api/v1/rewards/draws/{id}/buy-ticket`

**Still Working (Read-Only):**
- `GET /api/v1/wallet` - returns balance but can't be spent/topped up

**New/Updated:**
- `GET /api/v1/dashboard` - returns v37 schema with canPlay, tokensLeft
- `GET /api/v1/rewards/draws/active` - returns v37 draws (points-based)
- `GET /api/v1/rewards/draws/history` - returns v37 history (wonTier, wonPrize)
- `POST /api/v1/admin/rewards/draws` - create draw with v37 schema (returns 202)
- `GET /api/v1/admin/rewards/draws` - list draws
- `GET /api/v1/admin/rewards/draws/{id}` - get draw detail
- `GET /api/v1/admin/rewards/draws/{id}/standings` - get standings
- `POST /api/v1/admin/rewards/draws/{id}/close` - close draw (maker-checker)
- `POST /api/v1/admin/rewards/draws/{id}/select-winners` - select winners (maker-checker)
- `GET /api/v1/admin/rewards/draws/{id}/winners` - get winners

### Key Changes
1. **Wallet is retired for spending** - still readable but not used for play gating
2. **Play is subscription-only** - `canPlay` flag from dashboard controls access
3. **Draws are points-based** - no tickets, users earn points by playing games during qualifying period
4. **Draws have dates** - startsOn, endsOn (qualifying period), drawDate (when winners picked)
5. **Multi-tier prizes** - optional `prizeTiers[]` for Gold/Silver/Bronze style draws

### Testing Strategy
1. Add temporary console.logs to verify API responses
2. Implement changes incrementally
3. Build after each major section
4. Test with real backend data
5. Remove console.logs after verification
