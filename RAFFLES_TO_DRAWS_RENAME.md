# "Raffles" to "Draws" UI Rename

## Overview
Renamed all player-facing instances of "Raffles" to "Draws" per product direction from the backend team. Also removed the "Active Draw" badge from draw cards as requested.

## Changes Made

### 1. Navigation (Sidebar)
**File:** `components/layout/nav-items.ts`
- Changed nav label from "Raffles" to "Draws"
- Kept route path as `/raffles` (folder structure unchanged)
- Updated comment: "Dashboard, Play Trivia, Store, Leaderboard, **Draws**, Refer & Earn, Profile"

### 2. Draws Page
**File:** `app/(authenticated)/raffles/page.tsx`
- Page heading: "Raffles & Rewards" → "**Draws & Rewards**"
- Subtitle: "Exchange your points for raffle tickets" → "Exchange your tokens for **draw tickets**"
- Loading message: "Loading raffles..." → "Loading **draws**..."
- Empty state: "No active raffle draws right now" → "No active **draws** right now"
- Comment: "Fetch active raffles" → "Fetch active **draws**"

### 3. Active Draw Card (Badge Removal)
**File:** `app/features/raffles/presentation/active-draw-card.tsx`

**Removed the "Active Draw" badge entirely:**
```tsx
// REMOVED:
<span className="bg-primary text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full inline-flex items-center gap-1.5">
  <Ticket size={12} />
  Active Draw
</span>
```

**Adjusted spacing:**
- Removed `mt-4` from `<h2>` (prize name) since it was spacing below the removed badge
- Prize name now sits cleanly at the top of the card

### 4. Home Dashboard - Active Draws Widget
**File:** `app/features/home/presentation/active-raffles.tsx`
- Comment: "The full **raffle** status badge set" → "The full **draw** status badge set"
- Comment: "**Raffles** Module task" → "**Draws** Module task"
- Function: `RaffleSkeleton()` → `DrawSkeleton()`
- Empty state: "No active raffles right now" → "No active **draws** right now"

### 5. Landing Page
**File:** `app/page.tsx`
- Hero copy: "enter exclusive raffles" → "enter exclusive **draws**"

### 6. Notification Preferences
**File:** `app/features/profile/presentation/notification-preferences.tsx`
- Preference label: "Raffle draw results" → "**Draw** results"
- (Kept backend field name `raffleDrawResults` unchanged - API contract)

## What Was NOT Changed

### Backend-Facing Code (API Contract)
These map directly to real backend fields and were intentionally left unchanged:

1. **Type names:** `Raffle`, `RaffleDraw`, `ActiveDrawsResponse`
2. **Store names:** `useRaffleStore`, `raffle-storage`
3. **API field names:** `raffleDrawResults` (notification preference)
4. **Variable names:** `raffles`, `activeRaffles`, `raffle.id`
5. **Function names:** `fetchActiveDraws()`, `purchaseRaffleTicket()`
6. **API endpoints:** `/api/v1/rewards/draws/active` (already says "draws")
7. **Payment purpose:** `RAFFLE_TICKET` enum value
8. **Admin report endpoints:** `/api/v1/admin/reports/raffles`
9. **Folder structure:** `app/(authenticated)/raffles/`, `app/features/raffles/`

**Reasoning:** These are tied to the backend API contract. Renaming them would break the integration without a coordinated backend change.

## Files Modified Summary

| File | Changes |
|------|---------|
| `components/layout/nav-items.ts` | Nav label: "Raffles" → "Draws" |
| `app/(authenticated)/raffles/page.tsx` | Heading, subtitle, messages updated |
| `app/features/raffles/presentation/active-draw-card.tsx` | Removed "Active Draw" badge, adjusted spacing |
| `app/features/home/presentation/active-raffles.tsx` | Comments, function names, empty state |
| `app/page.tsx` | Landing page hero copy |
| `app/features/profile/presentation/notification-preferences.tsx` | Notification label |

## Visual Changes

### Before
```
Sidebar: 🎫 Raffles

Page Heading: Raffles & Rewards
Subtitle: Exchange your points for raffle tickets

Card:
┌─────────────────────────┐
│ 🎫 ACTIVE DRAW          │ ← Badge removed
│                         │
│ iPhone 15 Pro Max       │ ← mt-4 spacing
│ ...                     │
└─────────────────────────┘

Empty state: No active raffle draws right now
```

### After
```
Sidebar: 🎫 Draws

Page Heading: Draws & Rewards
Subtitle: Exchange your tokens for draw tickets

Card:
┌─────────────────────────┐
│ iPhone 15 Pro Max       │ ← No badge, no gap
│ ...                     │
└─────────────────────────┘

Empty state: No active draws right now
```

## Data Source Confirmation

✅ **Confirmed using live backend data:**
- Page pulls from `GET /api/v1/rewards/draws/active` via `useRaffleStore`
- No mock data or hardcoded draws
- All draw details (prizeName, ticketCostTokens, scheduleLabel, etc.) from API
- Store updates via `fetchActiveDraws()` function

## Testing Checklist

- [x] Build compiles successfully
- [ ] Sidebar shows "Draws" instead of "Raffles"
- [ ] Draws page heading shows "Draws & Rewards"
- [ ] Draw cards display prize name at top without badge
- [ ] No spacing gap where badge was removed
- [ ] Empty state message says "No active draws right now"
- [ ] Home dashboard widget says "No active draws" when empty
- [ ] Notification preferences show "Draw results"
- [ ] Landing page says "enter exclusive draws"
- [ ] Backend integration still works (API fields unchanged)

## Migration Notes

This is a **UI-only rename** - the underlying data model, API contract, and folder structure remain unchanged. A future refactor could rename folders/files for consistency, but that requires:
1. Moving `app/(authenticated)/raffles/` to `app/(authenticated)/draws/`
2. Updating all route references from `/raffles` to `/draws`
3. Renaming `app/features/raffles/` to `app/features/draws/`
4. Updating all internal imports

This was intentionally deferred to minimize scope and avoid breaking existing functionality.

## Product Context

**Why "Draws" instead of "Raffles"?**
- Product direction from backend team
- "Draws" is simpler, more direct terminology
- Aligns with other gaming/lottery platforms
- "Raffle" can imply charity/fundraising context

**Why remove the "Active Draw" badge?**
- Backend team feedback: didn't like that label
- Badge was redundant - page only shows active draws anyway
- Cleaner, less cluttered card design
- Prize name is the key information, should be prominent
