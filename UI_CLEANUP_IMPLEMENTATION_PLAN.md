# UI Cleanup Implementation Plan

## Summary of Requirements

### Section 1: Global Table Rule
- ✅ Created `components/ui/data-table.tsx` with shared components
- ✅ Rules: `whitespace-nowrap`, `px-5 py-3` padding, `min-h-[52px]` rows
- ✅ Sticky header, optional sticky first column (desktop only)
- ✅ Horizontal scroll in card with visible scrollbar
- ✅ Two-line cells max (primary + secondary muted)
- ✅ Long text gets `max-w-[280px] truncate` with title tooltip
- ⏳ **TODO**: Migrate all tables to use new components

### Section 2: Winners Table Redesign
**New column structure (12 columns, each single-line):**
1. Winner: name (primary), email (muted)
2. Phone: single line
3. Draw: draw name (primary), draw code (muted, monospace, labeled "Draw code")
4. Prize: `prizeName ?? drawName` (primary), "Tier: Winner" or "No tier" (muted)
5. Type: badge only (neutral with icon)
6. Amount: right-aligned `₦1,000` or "—"
7. Plan: "Monthly · Active" (plan + status with middle dot)
8. Rank / Points: "1 · 100 pts" or "—"
9. Status: badge only (new colours)
10. Awaiting approval: separate column "Redeem pending"/"Fulfil pending" or "—"
11. Selected on: `13 Nov 2026, 02:00` format
12. Chevron: open drawer icon

**Same for Redemptions tab with adjusted columns**

### Section 3: Status Colours
- ✅ Created `components/ui/status-badge.tsx`
- **Winner status**:
  - SELECTED: blue "Selected"
  - REDEEMED: amber "Redeemed"  
  - DISBURSED: green "Paid" (CASH) / "Collected" (ITEM)
- **Awaiting approval**: violet with clock icon
- **Subscription status**:
  - ACTIVE: green
  - EXPIRED: grey neutral
  - PENDING_PAYMENT: amber "Pending payment"
- **Draw status**:
  - ACTIVE: green
  - CLOSED: grey neutral
  - CANCELLED: red
- **Approval status**:
  - PENDING: amber
  - APPROVED: green
  - REJECTED: red
- **Prize type**: neutral outlined with icon (₦ for CASH, gift for ITEM)
- ⏳ **TODO**: Replace all Badge usage with StatusBadge across admin

### Section 4: Date Format
- ✅ Created `lib/utils/date-format.ts`
- Format: dates `13 Nov 2026`, date-times `13 Nov 2026, 02:00` (24-hour, Lagos)
- ⏳ **TODO**: Replace all date formatting calls across admin

### Section 5: Subscription Entries Filters
**Answer to requirements:**
- **(a)** Current endpoint: `getSubscriptionReportSummary()` and deprecated `getSubscriptionReportList()`
- **(b)** A2 partially built: `getSubscriptionReport()` exists with full filter support but UI doesn't use it
- **(c)** Filters UI was skipped

**Implementation needed:**
- Filter bar: From (datetime), To (datetime), Search (email/phone), Package (select), Status (dropdown)
- Presets: Today, Last 7 days, This month (Lagos time)
- Active filter chips (removable)
- Validation: From ≤ To
- URL query string persistence
- Summary tiles: total subscriptions, revenue, status breakdown, package breakdown
- Table columns: Subscriber (name/email), Phone, Package, Amount, Status, Starts, Expires, Created
- CSV/PDF export with filters
- Empty/error/loading states

## Files to Create/Modify

### New Files Created ✅
1. `components/ui/data-table.tsx` - Shared table components
2. `components/ui/status-badge.tsx` - Unified status badges
3. `lib/utils/date-format.ts` - Date formatting utilities

### Files to Modify

#### Section 1 & 2: Winners Table
1. `app/admin/winners/page.tsx` - Migrate to new table components, redesign columns
2. `components/admin/winner-detail-drawer.tsx` - Update date formats, status badges

#### Section 3: Status Badge Migration
1. `app/admin/winners/page.tsx` - Replace Badge with StatusBadge
2. `app/admin/change-requests/page.tsx` - Approval status badges
3. `app/admin/users/page.tsx` - Subscription status badges
4. `app/admin/reports/page.tsx` - Draw status badges
5. `app/admin/rewards/page.tsx` - Draw status badges
6. `components/admin/status-badge.tsx` (existing) - May need updates/removal

#### Section 4: Date Format Migration
Search and replace in these files:
1. `app/admin/winners/page.tsx`
2. `app/admin/change-requests/page.tsx`
3. `app/admin/users/page.tsx`
4. `app/admin/reports/page.tsx`
5. `app/admin/rewards/page.tsx`
6. `app/admin/audit-log/page.tsx`
7. `app/admin/notifications/page.tsx`
8. `components/admin/winner-detail-drawer.tsx`
9. Any other files with date formatting

#### Section 5: Subscription Entries
1. `app/admin/reports/page.tsx` - Complete implementation of filters, summary, table

## Tables to Migrate to New Components

1. ✅ Winners table (`app/admin/winners/page.tsx`) - Winners tab
2. ✅ Redemptions table (`app/admin/winners/page.tsx`) - Redemptions tab
3. ⏳ Subscription Entries (`app/admin/reports/page.tsx`) - Subscriptions tab
4. ⏳ Draws table (`app/admin/reports/page.tsx`) - Draws tab
5. ⏳ Draws list (`app/admin/rewards/page.tsx`) - Card layout, but has tables in detail views
6. ⏳ Approvals list (`app/admin/change-requests/page.tsx`)
7. ⏳ Users table (`app/admin/users/page.tsx`)
8. ⏳ Audit Log table (`app/admin/audit-log/page.tsx`)
9. ⏳ Notifications table (`app/admin/notifications/page.tsx`)
10. ⏳ Trivia tables (if any in `app/admin/trivia-setup/page.tsx`)
11. ⏳ Income report (`app/admin/reports/page.tsx`) - Income tab

## Implementation Order

1. **Phase 1** ✅: Create shared components (done)
2. **Phase 2**: Implement Section 5 (Subscription Entries with filters)
   - Most visible new feature
   - Tests all new components together
   - Provides template for other tables
3. **Phase 3**: Migrate Winners/Redemptions tables
   - High-priority, user-facing
   - Redesign columns per Section 2
4. **Phase 4**: Replace all status badges
   - Search-and-replace across admin
5. **Phase 5**: Replace all date formats
   - Search-and-replace across admin
6. **Phase 6**: Migrate remaining tables
   - Draws, Approvals, Users, Audit, etc.

## Testing Checklist

- [ ] Build passes, no TypeScript errors
- [ ] Lint passes, no `any` types
- [ ] No table cell wraps (verify `white-space: nowrap` computed)
- [ ] Screenshots at 1440px and 390px for:
  - [ ] Winners table
  - [ ] Redemptions table
  - [ ] Subscription Entries with filters and summary
  - [ ] Draws table
  - [ ] Approvals list
  - [ ] Users table
- [ ] Horizontal scroll works with visible scrollbar
- [ ] Sticky header works
- [ ] Sticky first column works on desktop (>768px)
- [ ] Long text truncates with tooltip
- [ ] All dates show in new format
- [ ] All status badges use new colours
- [ ] Red reserved for destructive/rejected only
- [ ] CSV/PDF export works with filters

## Progress Tracking

### Completed ✅
- [x] Shared table components created
- [x] Shared status badge component created
- [x] Shared date format utilities created
- [x] Build still passes

### In Progress ⏳
- [ ] Section 5: Subscription Entries filters (NEXT)

### Pending
- [ ] Section 2: Winners table redesign
- [ ] Section 3: Migrate all status badges
- [ ] Section 4: Migrate all date formats
- [ ] Section 1: Migrate all tables to shared components
