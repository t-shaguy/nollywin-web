# v37 FINAL Implementation Status

## ✅ COMPLETED

### A. Types Updated with Verified Shapes
- ✅ `PlayerDashboard` interface updated with verified fields:
  - `freeAttemptsLeft` added
  - `subscription` fields made non-optional with correct types
  - `activeRaffles` updated with `id`, `entered`, `myTickets` fields
  - All nullable fields properly typed
- ✅ Build passes with no TS errors

### B. Game Flow (Already Clean)
- ✅ No `useWalletStore`, `tokenBalance`, or `fetchWalletBalance` in game flow
- ✅ Dashboard refresh after game ends
- ✅ 402 handling on game start

### C. Existing Components
- ✅ Top bar with 5 header states (no plan, 0 tokens, N tokens, unlimited, payment pending)
- ✅ Africa/Lagos timezone formatting for `attemptsResetAt`
- ✅ Dashboard header with proper state handling
- ✅ Active raffles with tier display logic
- ✅ Entered chip logic implemented
- ✅ Legacy draw handling (null dates, tickets vs points)

## 🚧 REMAINING WORK

### Section C.1: Final Cleanup ✅ (Build Already Passes)
**Status**: Build passes, no wallet references in game flow

**Remaining references (OK)**:
- Documentation files only (`*.md` files)
- Admin reports (TOKEN_TOPUPS historical data)
- Notifications page (WALLET_TOPUP notification type)
- Legacy admin types (will be removed when admin draws is completed)

### Section C.2: Admin Draws - NEEDS COMPLETION
**Priority**: HIGH
**Files to update**:
1. `lib/api/admin.ts`
   - ❌ Update `AdminDrawDetails` to match verified shape (remove `ticketCostTokens`)
   - ❌ Update `CreateDrawRequest` / `UpdateDrawRequest` to remove `ticketCostTokens`
   - ❌ Add `GET /admin/rewards/draws/{id}/standings` with verified shape
   - ❌ Verify winners endpoint matches expected shape

2. `app/admin/rewards/page.tsx`
   - ❌ Remove `ticketCostTokens` from create form
   - ❌ Implement tiers logic: with tiers, `maxWinners` is read-only sum
   - ❌ Add standings section with projected tier labels
   - ❌ Update action matrix with ACTIVE/CLOSED rules
   - ❌ Add date validation (endsOn >= startsOn, drawDate >= endsOn)
   - ❌ Handle legacy draws (null endsOn) for "Select winners" action
   - ❌ Show backend error messages on 400
   - ❌ Use ConfirmDialog for all actions
   - ❌ Show resultSummary after 202 responses

**Verified API Shapes Needed**:
```typescript
// Standings
{ position, authUserId, email, points, correctAnswers }[]

// Create response
202 with { changeRequestId }

// Winners (assumed - verify)
{ tierName?, prizeName?, rankPosition?, points?, ...userFields }[]
```

### Section C.3: Reports > Raffles - NEEDS COMPLETION
**Priority**: MEDIUM
**File**: `app/admin/reports/page.tsx`
- ❌ Remove `ticketCostTokens` column
- ❌ Add/verify columns: Raffle code, Starts, Ends, Draw date
- ❌ Handle null dates for legacy draws (show "-")
- ❌ Update CSV export if it exists

### Section C.4: Change Requests - NEEDS COMPLETION
**Priority**: MEDIUM
**File**: `app/admin/change-requests/page.tsx` (verify path)
- ❌ Add approval form with `approvalNote` field (required for financial)
- ❌ Show `resourceType`/`action` (e.g. "RaffleDraw - CREATE")
- ❌ Display `resultSummary` after approval
- ❌ Handle 403 gracefully (checker role)
- ❌ Parse `requestBody`/`pathParams` JSON strings defensively

### Section B: Player Draws UI - NEEDS COMPLETION
**Priority**: HIGH
**Files**:
1. `app/features/raffles/presentation/active-draw-card.tsx`
   - ✅ Prize tiers display (done)
   - ✅ Entered chip (done)
   - ❌ Verify period format "DD MMM YYYY - DD MMM YYYY"
   - ❌ Add draw-date chip with countdown text
   - ❌ Verify no-plan message with "Get a plan" link

2. `components/ui/draw-countdown-modal.tsx`
   - ❌ Update countdown wording (0 days "today", 1 "tomorrow", etc.)
   - ❌ Calendar days in Africa/Lagos
   - ❌ Respect prefers-reduced-motion
   - ❌ Auto-show once per session for nearest draw

3. `app/(authenticated)/raffles/page.tsx`
   - ❌ Trigger countdown modal on card tap
   - ❌ Auto-show logic with sessionStorage

4. History tab
   - ✅ Basic implementation done
   - ❌ Verify all fields match verified shape

5. Store page
   - ❌ Update to show subscription packages only
   - ❌ Use verified packages shape (fee in naira, attemptsIncluded|null)
   - ❌ Purchase flow: `POST /subscriptions/purchase { packageId }`
   - ❌ Redirect to Paystack authorization URL

## 📋 VERIFICATION NEEDED

### API Shapes to Confirm
1. ❓ `GET /admin/rewards/draws/{id}/winners` - assumed fields need verification
2. ❓ `GET /admin/reports/raffles` - verify exact column names
3. ❓ `POST /admin/rewards/draws/{id}/select-winners` - behavior after 202

### UI Screenshots Needed (when complete)
- [ ] Home header (all 5 states)
- [ ] Draws page (new draw with points, legacy draw)
- [ ] Countdown popup
- [ ] History tab
- [ ] Store page
- [ ] Admin Create Draw (single + tiered + 2 invalid cases)
- [ ] Admin draw detail (ACTIVE / CLOSED-no-winners / CLOSED-winners-selected)
- [ ] Standings view
- [ ] Change requests page
- [ ] Reports > Raffles

### Final Grep Check
- [ ] No `buy-ticket` in user-facing code
- [ ] No wallet top-up references in UI
- [ ] No `ticketCostTokens` in user-facing displays
- [ ] No "attempts left" in user text

## 🎯 NEXT STEPS

1. **Section C.2 - Admin Draws** (highest priority)
   - Update API types
   - Rewrite rewards page with verified logic
   - Test all action matrix states

2. **Section B - Player Draws UI** (user-facing)
   - Complete draw card display
   - Implement countdown modal wording
   - Update store page for subscriptions

3. **Section C.3 & C.4 - Reports & Change Requests**
   - Update reports table
   - Enhance change requests page

4. **Final verification**
   - Build check
   - Grep check
   - Screenshots

## 📝 NOTES

- Build currently passes ✅
- Core types updated with verified shapes ✅
- Game flow clean ✅
- Major remaining work: Admin Draws page, Player Draws UI refinements, Store page
- Token budget: Continue in focused sections, ensuring build passes after each
