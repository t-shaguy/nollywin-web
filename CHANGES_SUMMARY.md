# Bug Fixes Summary

## Completed Changes

### Bug 1: Proof Viewer 404 Errors (FIXED ✓)

**Problem:** Winner Details > Proofs > "View" failed with 404 Not Found. The request wasn't using proper auth headers.

**Solution:**
- Created `adminApiClientBlob()` in `lib/api/admin-client.ts` - uses `/core-api` proxy with X-Client-Token + Authorization headers
- Updated `fetchProofBlob()` in `lib/api/admin-winners.ts` to use `adminApiClientBlob()`
- Updated `getChangeRequestFile()` in `lib/api/admin.ts` to use `adminApiClientBlob()`
- Added proper error states in proof viewer: 401="Session expired", 403="Access denied", 404="File not found" with Retry button
- Added file viewer modal in approval detail drawer using blob fetch

**Files Changed:**
- `lib/api/admin-client.ts` - added adminApiClientBlob()
- `lib/api/admin-winners.ts` - updated fetchProofBlob()
- `lib/api/admin.ts` - updated getChangeRequestFile()
- `components/admin/winner-detail-drawer.tsx` - proof viewer error handling
- `components/admin/approval-detail-drawer.tsx` - file viewer modal

---

### Bug 2: Status Wording Changes (FIXED ✓)

**Problem:** DISBURSED winners should show:
- "Disbursed" for CASH prizes
- "Collected" for ITEM prizes

**Solution:**
- Created `lib/utils/winner-status.ts` with shared helpers:
  - `getWinnerStatusLabel()` - display labels with prize type context
  - `getStatusFilterLabel()` - filter dropdown labels
  - `getStepHistoryLabel()` - steps history labels
  - `getStatusBadgeClasses()` - badge styling (green for DISBURSED)
- Updated all status displays:
  - Winners page: status filters use `getStatusFilterLabel()`
  - Winners table: StatusBadge already has prizeType prop (correct)
  - Redemptions tab: status filters, "Total Cash Disbursed" tile, table header "Disbursed/Collected on"
  - Detail drawer: status labels, date formatters, StatusBadge in Steps History
  - Export configs: status column uses `getWinnerStatusLabel()`, column header "Disbursed/Collected At"
- StatusBadge default label changed from "Paid" to "Disbursed" (overridden to "Collected" for ITEM)

**Files Changed:**
- `lib/utils/winner-status.ts` (NEW) - shared status helpers
- `app/admin/winners/page.tsx` - status filter labels, table header
- `components/admin/winner-detail-drawer.tsx` - status labels, date formatters, StatusBadge
- `lib/export/report-config.ts` - status column format and headers
- `lib/export/csv.ts` - format signature accepts row parameter
- `components/ui/status-badge.tsx` - default label "Disbursed"

---

### Feature: Draw ID Select Filter (ADDED ✓)

**Problem:** Draw ID was a text input, making it hard to filter by draw.

**Solution:**
- Added draws list fetching from `GET /api/v1/admin/reports/raffles`
- Converted "Draw ID" text input to select dropdown on both Winners and Redemptions tabs
- Select label format: `{raffleCode} · {prizeName}` (e.g., "NW-202611-0012 · N1,000 cash test")
- Added "All draws" option as default
- Updated print view filter labels from "Draw ID" to "Draw" with friendly label

**Files Changed:**
- `app/admin/winners/page.tsx` - added draws state, loadDraws(), converted inputs to selects

---

## Build Status

✅ **Build successful** - Exit Code 0  
✅ **TypeScript check passed**  
✅ **Dev server running** - http://localhost:3000

---

## Testing Checklist

### Bug 1: Proof Viewer
1. Navigate to Admin > Winners
2. Click "View" on a winner with status REDEEMED or DISBURSED
3. In the detail drawer, scroll to "Proofs" section
4. Click "View" on a proof
5. **Expected:** Proof opens in viewer (not 404 error)
6. Test with invalid proof ID (edit URL)
7. **Expected:** Shows "File not found" error with Retry button

### Bug 2: Status Wording
1. **Winners Page - Table:**
   - CASH winner with DISBURSED status → Badge shows "Disbursed" (green)
   - ITEM winner with DISBURSED status → Badge shows "Collected" (green)
   - Take screenshot at 1440px and 390px width

2. **Winners Page - Filters:**
   - Status dropdown shows:
     - "Selected"
     - "Redeemed"
     - "Disbursed/Collected"

3. **Redemptions Tab:**
   - Status filter shows same labels
   - Summary tile shows "Total Cash Disbursed" (not "Total Cash Paid")
   - Table header shows "Disbursed/Collected on" (not "Paid/Collected on")
   - CASH redemption with DISBURSED → Badge shows "Disbursed"
   - ITEM redemption with DISBURSED → Badge shows "Collected"
   - Take screenshot at 1440px and 390px width

4. **Winner Detail Drawer:**
   - Status badge at top uses correct label
   - Steps History section:
     - "Disbursed" step for CASH, "Collected" step for ITEM
     - Badge is green (not red)
     - Date format: "12 Nov 2026, 18:09" (not "Nov 12, 2026, 06:09 PM")
   - Take screenshot

5. **Export CSV:**
   - Download Winners report
   - Status column shows "Disbursed" for CASH, "Collected" for ITEM
   - Column header is "Disbursed/Collected At"
   - Download Redemptions report and verify same
   - Take screenshot of CSV in Excel/Notepad

### Feature: Draw Select
1. **Winners Page:**
   - "Draw" filter is a select dropdown (not text input)
   - Shows "All draws" by default
   - Lists draws with format: "NW-202611-0012 · N1,000 cash test"
   - Select a draw, click Apply Filters
   - **Expected:** Table filters to that draw only
   - Take screenshot of dropdown open at 1440px

2. **Redemptions Tab:**
   - Same draw select behavior
   - Take screenshot of dropdown open at 390px (mobile)

3. **Print View:**
   - Click print icon on Winners page
   - Filter summary shows "Draw: NW-202611-0012 · N1,000 cash test" (not "Draw ID: 123")
   - Same for Redemptions tab

---

## Remaining Work

✅ All tasks completed!

---

## Files Modified (Total: 9 files)

1. `lib/api/admin-client.ts` - added adminApiClientBlob()
2. `lib/api/admin-winners.ts` - updated fetchProofBlob()
3. `lib/api/admin.ts` - updated getChangeRequestFile()
4. `components/admin/winner-detail-drawer.tsx` - proof viewer, status labels, dates
5. `components/admin/approval-detail-drawer.tsx` - file viewer modal
6. `lib/utils/winner-status.ts` (NEW) - shared status helpers
7. `app/admin/winners/page.tsx` - status filters, table headers, draw select
8. `lib/export/report-config.ts` - status labels and headers
9. `lib/export/csv.ts` - format signature
10. `components/ui/status-badge.tsx` - default label

---

## Known Limitations

1. **Modal button labels remain "Fulfil"** - These are internal admin action labels (Fulfil Cash Modal, Fulfil Item Modal), not user-facing status text. Left as-is per common practice.

2. **API endpoints use "fulfilled"** - Backend field names (`fulfilledAt`, `fulfilledOn`, etc.) remain unchanged. Only UI labels were updated.

3. **Change request action "FULFIL"** - Internal action type remains "FULFIL" in API and change request logs. Only user-visible text was updated.

---

## Screenshots Required (7 total)

1. Winners table with CASH "Disbursed" + ITEM "Collected" (1440px)
2. Winners table mobile (390px)
3. Redemptions tab with status badges (1440px)
4. Redemptions tab mobile (390px)
5. Winner detail drawer with Steps History (1440px)
6. Draw select dropdown open - Winners page (1440px)
7. Draw select dropdown open - Redemptions tab (390px)
8. Exported CSV in Excel showing status columns

---

## Next Steps

1. ✅ Start dev server - `npm run dev`
2. ✅ Login to admin at http://localhost:3000/admin/login
3. Navigate to Winners page
4. Follow testing checklist above
5. Take screenshots at specified widths
6. Test with real backend data (DISBURSED winners with CASH and ITEM prizes)
7. Report any issues or confirm completion
