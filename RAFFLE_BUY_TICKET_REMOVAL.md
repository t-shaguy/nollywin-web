# Raffle Buy-Ticket Flow Removal - Implementation Summary

## Backend Team Request
Remove the entire "Buy Ticket" flow from the player Draws & Rewards page. Make tickets read-only and show timeframe for each draw/entry.

## Changes Implemented

### 1. Removed Buy-Ticket Functionality

#### Files Modified:
- **`app/features/raffles/presentation/active-draw-card.tsx`**
  - Removed `PurchaseTicketModal` import and state
  - Removed "Buy Ticket" button from the card
  - Kept cost-per-ticket panel as read-only info
  - Added timeframe display with Clock icon showing `scheduleLabel`
  - Improved pluralization: "1 ticket" vs "N tickets"
  
- **`app/features/raffles/presentation/raffle-history-list.tsx`**
  - Updated empty state text: removed "Buy tickets..." message
  - Fixed pluralization: "Your ticket" vs "Your tickets"

#### Files Deleted:
- **`app/features/raffles/presentation/purchase-ticket-modal.tsx`**
  - Entire modal component removed (200+ lines)
  - Handled confirm/success/error steps
  - Quantity selection UI
  - Token balance checks
  
#### API Changes - `lib/api/leaderboard.ts`:
- Removed `BuyTicketRequest` interface
- Removed `BuyTicketResponse` interface  
- Removed `buyTicket()` function (POST /api/v1/rewards/draws/{drawId}/buy-ticket)

#### Store Changes - `store/raffle-store.ts`:
- Removed `fetchWalletBalance` import (no longer needed after purchase)
- Removed `updateRaffleTickets` method from store state
- Removed `purchaseRaffleTicket()` async function
- Simplified store to read-only operations

### 2. Added Timeframe Display

#### Active Draws (Active Tab):
- Each draw card now shows the `scheduleLabel` field with a Clock icon
- Example: "Every Friday 8PM"
- Styled with 13px muted text
- Positioned below the prize name

#### My Entries (History Tab):
- History entries already show `createdAt` (when the user entered the draw)
- No `scheduleLabel` field available in history API response
- Current display is appropriate for historical entries

### 3. API Fields Verified

#### GET /api/v1/rewards/draws/active Response:
```typescript
{
  id: string;
  prizeName: string;
  ticketCostTokens: number;
  scheduleLabel: string; // ✅ Used for timeframe (e.g. "Every Friday 8PM")
  maxWinners: number;
  status: "ACTIVE" | "UPCOMING" | "COMPLETED" | "CANCELLED";
  entryCount: number;
  winnersSelected: boolean;
  userTicketCount?: number;
}
```

**No date/time fields found:** The API only returns `scheduleLabel` (free text). There are NO fields like `startsAt`, `endsAt`, `drawDate`, `closesAt`, or `scheduledAt`.

#### GET /api/v1/rewards/draws/history Response:
```typescript
{
  drawId: string;
  prizeName: string;
  drawStatus: "ACTIVE" | "UPCOMING" | "CLOSED" | "CANCELLED";
  myTickets: number;
  winnerStatus: "SELECTED" | null;
  createdAt: string; // ✅ ISO 8601 - when user entered the draw
}
```

**No scheduleLabel in history:** The history endpoint doesn't include the draw's schedule label, only when the user created their entry (`createdAt`).

### 4. Pluralization Fixes
- Active draws: "1 ticket" vs "N tickets"
- Active draws: "1 entry" vs "N entries"  
- History: "Your ticket: 1" vs "Your tickets: N"

### 5. Dead Code Cleanup
Verified no remaining references to:
- `buy-ticket` or `buyTicket`
- `purchaseRaffleTicket`
- `PurchaseTicketModal`
- `BuyTicketRequest` / `BuyTicketResponse`

## Build Status
✅ Build passed with no errors or warnings
✅ TypeScript validation passed
✅ All buy-ticket references removed

## Pages Affected
- **Player Only:** `/raffles` (Draws & Rewards page)
- **Admin Pages:** No changes (as requested)
- **Other Player Pages:** No changes

## User Experience Changes

### Before:
1. User sees active draw
2. Clicks "Buy Ticket" button
3. Modal opens showing cost and confirmation
4. User confirms purchase
5. Tokens deducted, ticket count updated
6. Success message shown

### After:
1. User sees active draw (read-only)
2. Can see cost per ticket as information only
3. Can see their current ticket count
4. Can see the draw schedule (e.g. "Every Friday 8PM")
5. No purchase action available

## Testing Checklist
- [x] Build passes without errors
- [x] No TypeScript errors
- [x] Active draws show timeframe with Clock icon
- [x] Cost per ticket panel displays as info only (no button)
- [x] User ticket count displays correctly
- [x] Entry count displays correctly
- [x] History tab shows entries with proper pluralization
- [x] Empty states updated (removed "buy tickets" language)
- [x] All buy-ticket code removed from codebase
- [ ] Visual check at desktop width (1440px)
- [ ] Visual check at mobile width (390px)
- [ ] Verify both tabs work correctly

## Notes for Backend Team
If you plan to add real date/time fields to the draws API in the future, consider:
- `drawStartsAt`: ISO 8601 timestamp for when draw opens
- `drawEndsAt`: ISO 8601 timestamp for when draw closes
- `drawDate`: ISO 8601 timestamp for when winners are selected

This would allow the frontend to display:
- Countdown timers ("Ends in 2d 4h")
- Formatted dates ("Closes: 25 Dec 2026, 8:00 PM")
- Timezone-aware display (Africa/Lagos)

Currently we're using `scheduleLabel` (free text) which works but is less precise.
